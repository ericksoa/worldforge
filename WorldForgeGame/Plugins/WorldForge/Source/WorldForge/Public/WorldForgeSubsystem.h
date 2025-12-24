#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "WorldForgeTypes.h"
#include "WorldForgeSubsystem.generated.h"

class UWorldForgeWebSocketServer;
class UWorldForgeDebugWidget;
class AWorldForgeSettlementActor;

/**
 * Main subsystem for WorldForge functionality.
 * Manages WebSocket connection and world state.
 */
UCLASS()
class WORLDFORGE_API UWorldForgeSubsystem : public UGameInstanceSubsystem, public FTickableGameObject
{
    GENERATED_BODY()

public:
    // Subsystem lifecycle
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    // FTickableGameObject interface
    virtual void Tick(float DeltaTime) override;
    virtual TStatId GetStatId() const override { RETURN_QUICK_DECLARE_CYCLE_STAT(UWorldForgeSubsystem, STATGROUP_Tickables); }
    virtual bool IsTickable() const override { return bWantsDebugWidget && !DebugWidget; }
    virtual bool IsTickableInEditor() const override { return true; }

    // WebSocket Server Control
    UFUNCTION(BlueprintCallable, Category = "WorldForge")
    void StartServer(int32 Port = 8765);

    UFUNCTION(BlueprintCallable, Category = "WorldForge")
    void StopServer();

    UFUNCTION(BlueprintPure, Category = "WorldForge")
    bool IsServerRunning() const;

    // Debug Widget
    UFUNCTION(BlueprintCallable, Category = "WorldForge|Debug")
    void ShowDebugWidget();

    UFUNCTION(BlueprintCallable, Category = "WorldForge|Debug")
    void HideDebugWidget();

    UFUNCTION(BlueprintPure, Category = "WorldForge|Debug")
    bool IsDebugWidgetVisible() const;

    // World State
    UFUNCTION(BlueprintPure, Category = "WorldForge")
    FWorldForgeState GetWorldState() const { return WorldState; }

    UFUNCTION(BlueprintCallable, Category = "WorldForge")
    void SetWorldState(const FWorldForgeState& NewState);

    // Trait Accessors
    UFUNCTION(BlueprintPure, Category = "WorldForge")
    float GetTrait(EWorldForgeTrait Trait) const;

    UFUNCTION(BlueprintCallable, Category = "WorldForge")
    void SetTrait(EWorldForgeTrait Trait, float Value);

    // Settlement/Landmark Management
    UFUNCTION(BlueprintPure, Category = "WorldForge|Landmarks")
    int32 GetSpawnedLandmarkCount() const { return SpawnedActors.Num(); }

    UFUNCTION(BlueprintCallable, Category = "WorldForge|Landmarks")
    bool DestroySettlement(const FString& LandmarkId);

    UFUNCTION(BlueprintCallable, Category = "WorldForge|Landmarks")
    void DestroyAllSettlements();

    // Events
    UPROPERTY(BlueprintAssignable, Category = "WorldForge")
    FOnWorldStateChanged OnWorldStateChanged;

    UPROPERTY(BlueprintAssignable, Category = "WorldForge")
    FOnCommandReceived OnCommandReceived;

    UPROPERTY(BlueprintAssignable, Category = "WorldForge")
    FOnConnectionStatusChanged OnConnectionStatusChanged;

    // Process incoming command from WebSocket
    void ProcessCommand(const FString& CommandJson);

private:
    UPROPERTY()
    TObjectPtr<UWorldForgeWebSocketServer> WebSocketServer;

    UPROPERTY()
    TObjectPtr<UWorldForgeDebugWidget> DebugWidget;

    UPROPERTY()
    FWorldForgeState WorldState;

    /** Flag to indicate we want to show the debug widget (polls until successful) */
    bool bWantsDebugWidget = false;

    // Command handlers
    void HandleSetEra(const TSharedPtr<FJsonObject>& Data);
    void HandleSetTrait(const TSharedPtr<FJsonObject>& Data);
    void HandleSetAtmosphere(const TSharedPtr<FJsonObject>& Data);
    void HandleSpawnSettlement(const TSharedPtr<FJsonObject>& Data);
    void HandleSyncWorldState(const TSharedPtr<FJsonObject>& Data);

    // Settlement spawning
    UPROPERTY()
    TMap<FString, TObjectPtr<AWorldForgeSettlementActor>> SpawnedActors;

    /** Minimum distance between spawned settlements (in Unreal units) */
    float MinimumSpawnDistance = 500.0f;

    /** Spawn radius from world origin */
    float SpawnRadius = 5000.0f;

    /** Find a valid spawn location that doesn't overlap with existing settlements */
    FVector FindValidSpawnLocation();

    /** Spawn a settlement actor with the given landmark data */
    AWorldForgeSettlementActor* SpawnSettlementActor(const FWorldForgeLandmark& Landmark);
};
