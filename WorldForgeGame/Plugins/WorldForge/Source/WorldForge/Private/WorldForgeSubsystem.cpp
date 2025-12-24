#include "WorldForgeSubsystem.h"
#include "WorldForgeWebSocketServer.h"
#include "WorldForgeDebugWidget.h"
#include "Json.h"
#include "JsonUtilities.h"
#include "Blueprint/UserWidget.h"
#include "TimerManager.h"
#include "Engine/World.h"

void UWorldForgeSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    UE_LOG(LogTemp, Log, TEXT("WorldForge: Subsystem initialized"));

    // Create WebSocket server
    WebSocketServer = NewObject<UWorldForgeWebSocketServer>(this);
    WebSocketServer->Initialize(this);

    // Auto-start server in development
#if WITH_EDITOR
    StartServer();
#endif

    // Always show debug widget - poll until PlayerController is available
    bWantsDebugWidget = true;
}

void UWorldForgeSubsystem::Deinitialize()
{
    bWantsDebugWidget = false;
    HideDebugWidget();
    StopServer();

    if (WebSocketServer)
    {
        WebSocketServer->Shutdown();
        WebSocketServer = nullptr;
    }

    Super::Deinitialize();
    UE_LOG(LogTemp, Log, TEXT("WorldForge: Subsystem deinitialized"));
}

void UWorldForgeSubsystem::Tick(float DeltaTime)
{
    // Try to show the debug widget if we want it but don't have it yet
    if (bWantsDebugWidget && !DebugWidget)
    {
        UE_LOG(LogTemp, Log, TEXT("WorldForge: Tick - attempting to show debug widget"));
        ShowDebugWidget();
    }
}

void UWorldForgeSubsystem::StartServer(int32 Port)
{
    if (WebSocketServer && !WebSocketServer->IsRunning())
    {
        if (WebSocketServer->StartServer(Port))
        {
            UE_LOG(LogTemp, Log, TEXT("WorldForge: Server started on port %d"), Port);
            OnConnectionStatusChanged.Broadcast(true);

            if (DebugWidget)
            {
                DebugWidget->SetConnectionStatus(true);
            }
        }
        else
        {
            UE_LOG(LogTemp, Error, TEXT("WorldForge: Failed to start server on port %d"), Port);
        }
    }
}

void UWorldForgeSubsystem::StopServer()
{
    if (WebSocketServer && WebSocketServer->IsRunning())
    {
        WebSocketServer->StopServer();
        UE_LOG(LogTemp, Log, TEXT("WorldForge: Server stopped"));
        OnConnectionStatusChanged.Broadcast(false);

        if (DebugWidget)
        {
            DebugWidget->SetConnectionStatus(false);
        }
    }
}

bool UWorldForgeSubsystem::IsServerRunning() const
{
    return WebSocketServer && WebSocketServer->IsRunning();
}

void UWorldForgeSubsystem::ShowDebugWidget()
{
    if (DebugWidget)
    {
        return; // Already visible
    }

    UE_LOG(LogTemp, Log, TEXT("WorldForge: ShowDebugWidget called"));

    // Get the first local player controller
    UWorld* World = GetWorld();
    if (!World)
    {
        UE_LOG(LogTemp, Warning, TEXT("WorldForge: Cannot show debug widget - no world"));
        return;
    }

    UE_LOG(LogTemp, Log, TEXT("WorldForge: Got world, looking for player controller"));

    APlayerController* PC = World->GetFirstPlayerController();
    if (!PC)
    {
        UE_LOG(LogTemp, Warning, TEXT("WorldForge: Cannot show debug widget - no player controller"));
        return;
    }

    UE_LOG(LogTemp, Log, TEXT("WorldForge: Got player controller, creating widget"));

    // Create and add the widget
    DebugWidget = CreateWidget<UWorldForgeDebugWidget>(PC, UWorldForgeDebugWidget::StaticClass());
    if (DebugWidget)
    {
        DebugWidget->AddToViewport(100); // High Z-order to appear on top
        DebugWidget->UpdateWorldState(WorldState);
        DebugWidget->SetConnectionStatus(IsServerRunning());
        UE_LOG(LogTemp, Log, TEXT("WorldForge: Debug widget created and added to viewport"));
        bWantsDebugWidget = false; // Stop polling
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("WorldForge: Failed to create debug widget!"));
    }
}

void UWorldForgeSubsystem::HideDebugWidget()
{
    if (DebugWidget)
    {
        DebugWidget->RemoveFromParent();
        DebugWidget = nullptr;
        UE_LOG(LogTemp, Log, TEXT("WorldForge: Debug widget hidden"));
    }
}

bool UWorldForgeSubsystem::IsDebugWidgetVisible() const
{
    return DebugWidget != nullptr && DebugWidget->IsInViewport();
}

void UWorldForgeSubsystem::SetWorldState(const FWorldForgeState& NewState)
{
    WorldState = NewState;
    OnWorldStateChanged.Broadcast(WorldState);

    // Update debug widget if visible
    if (DebugWidget)
    {
        DebugWidget->UpdateWorldState(WorldState);
    }
}

float UWorldForgeSubsystem::GetTrait(EWorldForgeTrait Trait) const
{
    return WorldState.GetTrait(Trait);
}

void UWorldForgeSubsystem::SetTrait(EWorldForgeTrait Trait, float Value)
{
    WorldState.SetTrait(Trait, Value);
    OnWorldStateChanged.Broadcast(WorldState);

    // Update debug widget if visible
    if (DebugWidget)
    {
        DebugWidget->UpdateWorldState(WorldState);
    }
}

void UWorldForgeSubsystem::ProcessCommand(const FString& CommandJson)
{
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(CommandJson);

    if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
    {
        UE_LOG(LogTemp, Warning, TEXT("WorldForge: Failed to parse command JSON: %s"), *CommandJson);
        return;
    }

    FString CommandType;
    if (!JsonObject->TryGetStringField(TEXT("type"), CommandType))
    {
        UE_LOG(LogTemp, Warning, TEXT("WorldForge: Command missing 'type' field"));
        return;
    }

    UE_LOG(LogTemp, Log, TEXT("WorldForge: Processing command: %s"), *CommandType);
    OnCommandReceived.Broadcast(CommandType, CommandJson);

    // Route to appropriate handler
    if (CommandType == TEXT("SET_ERA"))
    {
        HandleSetEra(JsonObject);
    }
    else if (CommandType == TEXT("SET_TRAIT"))
    {
        HandleSetTrait(JsonObject);
    }
    else if (CommandType == TEXT("SET_ATMOSPHERE"))
    {
        HandleSetAtmosphere(JsonObject);
    }
    else if (CommandType == TEXT("SPAWN_SETTLEMENT"))
    {
        HandleSpawnSettlement(JsonObject);
    }
    else if (CommandType == TEXT("SYNC_WORLD_STATE"))
    {
        HandleSyncWorldState(JsonObject);
    }
    else
    {
        UE_LOG(LogTemp, Warning, TEXT("WorldForge: Unknown command type: %s"), *CommandType);
    }
}

void UWorldForgeSubsystem::HandleSetEra(const TSharedPtr<FJsonObject>& Data)
{
    const TSharedPtr<FJsonObject>* EraObj;
    if (Data->TryGetObjectField(TEXT("era"), EraObj))
    {
        FWorldForgeEra Era;
        (*EraObj)->TryGetStringField(TEXT("id"), Era.Id);
        (*EraObj)->TryGetStringField(TEXT("name"), Era.Name);
        (*EraObj)->TryGetStringField(TEXT("period"), Era.Period);
        (*EraObj)->TryGetStringField(TEXT("description"), Era.Description);

        WorldState.Era = Era;
        OnWorldStateChanged.Broadcast(WorldState);
        UE_LOG(LogTemp, Log, TEXT("WorldForge: Era set to %s"), *Era.Name);
    }
}

void UWorldForgeSubsystem::HandleSetTrait(const TSharedPtr<FJsonObject>& Data)
{
    FString TraitName;
    double Value;

    if (Data->TryGetStringField(TEXT("trait"), TraitName) &&
        Data->TryGetNumberField(TEXT("value"), Value))
    {
        EWorldForgeTrait Trait;
        if (TraitName == TEXT("militarism")) Trait = EWorldForgeTrait::Militarism;
        else if (TraitName == TEXT("prosperity")) Trait = EWorldForgeTrait::Prosperity;
        else if (TraitName == TEXT("religiosity")) Trait = EWorldForgeTrait::Religiosity;
        else if (TraitName == TEXT("lawfulness")) Trait = EWorldForgeTrait::Lawfulness;
        else if (TraitName == TEXT("openness")) Trait = EWorldForgeTrait::Openness;
        else
        {
            UE_LOG(LogTemp, Warning, TEXT("WorldForge: Unknown trait: %s"), *TraitName);
            return;
        }

        SetTrait(Trait, static_cast<float>(Value));
        UE_LOG(LogTemp, Log, TEXT("WorldForge: Trait %s set to %f"), *TraitName, Value);
    }
}

void UWorldForgeSubsystem::HandleSetAtmosphere(const TSharedPtr<FJsonObject>& Data)
{
    FString AtmosphereName;
    if (Data->TryGetStringField(TEXT("atmosphere"), AtmosphereName))
    {
        EWorldForgeAtmosphere Atmosphere;
        if (AtmosphereName == TEXT("war_torn")) Atmosphere = EWorldForgeAtmosphere::WarTorn;
        else if (AtmosphereName == TEXT("prosperous")) Atmosphere = EWorldForgeAtmosphere::Prosperous;
        else if (AtmosphereName == TEXT("mysterious")) Atmosphere = EWorldForgeAtmosphere::Mysterious;
        else if (AtmosphereName == TEXT("sacred")) Atmosphere = EWorldForgeAtmosphere::Sacred;
        else if (AtmosphereName == TEXT("desolate")) Atmosphere = EWorldForgeAtmosphere::Desolate;
        else if (AtmosphereName == TEXT("vibrant")) Atmosphere = EWorldForgeAtmosphere::Vibrant;
        else
        {
            UE_LOG(LogTemp, Warning, TEXT("WorldForge: Unknown atmosphere: %s"), *AtmosphereName);
            return;
        }

        WorldState.Atmosphere = Atmosphere;
        OnWorldStateChanged.Broadcast(WorldState);
        UE_LOG(LogTemp, Log, TEXT("WorldForge: Atmosphere set to %s"), *AtmosphereName);
    }
}

void UWorldForgeSubsystem::HandleSpawnSettlement(const TSharedPtr<FJsonObject>& Data)
{
    const TSharedPtr<FJsonObject>* SettlementObj;
    if (Data->TryGetObjectField(TEXT("settlement"), SettlementObj))
    {
        FWorldForgeLandmark Landmark;
        (*SettlementObj)->TryGetStringField(TEXT("id"), Landmark.Id);
        (*SettlementObj)->TryGetStringField(TEXT("name"), Landmark.Name);
        (*SettlementObj)->TryGetStringField(TEXT("description"), Landmark.Description);

        FString TypeName;
        if ((*SettlementObj)->TryGetStringField(TEXT("type"), TypeName))
        {
            if (TypeName == TEXT("settlement")) Landmark.Type = EWorldForgeLandmarkType::Settlement;
            else if (TypeName == TEXT("fortress")) Landmark.Type = EWorldForgeLandmarkType::Fortress;
            else if (TypeName == TEXT("monastery")) Landmark.Type = EWorldForgeLandmarkType::Monastery;
            else if (TypeName == TEXT("ruin")) Landmark.Type = EWorldForgeLandmarkType::Ruin;
            else if (TypeName == TEXT("natural")) Landmark.Type = EWorldForgeLandmarkType::Natural;
        }

        WorldState.Landmarks.Add(Landmark);
        OnWorldStateChanged.Broadcast(WorldState);
        UE_LOG(LogTemp, Log, TEXT("WorldForge: Spawned settlement %s"), *Landmark.Name);
    }
}

void UWorldForgeSubsystem::HandleSyncWorldState(const TSharedPtr<FJsonObject>& Data)
{
    const TSharedPtr<FJsonObject>* StateObj;
    if (Data->TryGetObjectField(TEXT("state"), StateObj))
    {
        // Parse era
        const TSharedPtr<FJsonObject>* EraObj;
        if ((*StateObj)->TryGetObjectField(TEXT("era"), EraObj))
        {
            (*EraObj)->TryGetStringField(TEXT("id"), WorldState.Era.Id);
            (*EraObj)->TryGetStringField(TEXT("name"), WorldState.Era.Name);
            (*EraObj)->TryGetStringField(TEXT("period"), WorldState.Era.Period);
            (*EraObj)->TryGetStringField(TEXT("description"), WorldState.Era.Description);
        }

        // Parse traits
        const TSharedPtr<FJsonObject>* TraitsObj;
        if ((*StateObj)->TryGetObjectField(TEXT("traits"), TraitsObj))
        {
            double Value;
            if ((*TraitsObj)->TryGetNumberField(TEXT("militarism"), Value))
                WorldState.Militarism = static_cast<float>(Value);
            if ((*TraitsObj)->TryGetNumberField(TEXT("prosperity"), Value))
                WorldState.Prosperity = static_cast<float>(Value);
            if ((*TraitsObj)->TryGetNumberField(TEXT("religiosity"), Value))
                WorldState.Religiosity = static_cast<float>(Value);
            if ((*TraitsObj)->TryGetNumberField(TEXT("lawfulness"), Value))
                WorldState.Lawfulness = static_cast<float>(Value);
            if ((*TraitsObj)->TryGetNumberField(TEXT("openness"), Value))
                WorldState.Openness = static_cast<float>(Value);
        }

        // Parse atmosphere
        FString AtmosphereName;
        if ((*StateObj)->TryGetStringField(TEXT("atmosphere"), AtmosphereName))
        {
            if (AtmosphereName == TEXT("war_torn")) WorldState.Atmosphere = EWorldForgeAtmosphere::WarTorn;
            else if (AtmosphereName == TEXT("prosperous")) WorldState.Atmosphere = EWorldForgeAtmosphere::Prosperous;
            else if (AtmosphereName == TEXT("mysterious")) WorldState.Atmosphere = EWorldForgeAtmosphere::Mysterious;
            else if (AtmosphereName == TEXT("sacred")) WorldState.Atmosphere = EWorldForgeAtmosphere::Sacred;
            else if (AtmosphereName == TEXT("desolate")) WorldState.Atmosphere = EWorldForgeAtmosphere::Desolate;
            else if (AtmosphereName == TEXT("vibrant")) WorldState.Atmosphere = EWorldForgeAtmosphere::Vibrant;
        }

        OnWorldStateChanged.Broadcast(WorldState);

        // Update debug widget
        if (DebugWidget)
        {
            DebugWidget->UpdateWorldState(WorldState);
        }

        UE_LOG(LogTemp, Log, TEXT("WorldForge: World state synchronized"));
    }
}

