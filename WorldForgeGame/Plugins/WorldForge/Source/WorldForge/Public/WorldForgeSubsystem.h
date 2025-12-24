#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "WorldForgeTypes.h"
#include "WorldForgeSubsystem.generated.h"

class UWorldForgeWebSocketServer;

/**
 * Main subsystem for WorldForge functionality.
 * Manages WebSocket connection and world state.
 */
UCLASS()
class WORLDFORGE_API UWorldForgeSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    // Subsystem lifecycle
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    // WebSocket Server Control
    UFUNCTION(BlueprintCallable, Category = "WorldForge")
    void StartServer(int32 Port = 8765);

    UFUNCTION(BlueprintCallable, Category = "WorldForge")
    void StopServer();

    UFUNCTION(BlueprintPure, Category = "WorldForge")
    bool IsServerRunning() const;

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
    FWorldForgeState WorldState;

    void HandleSetEra(const TSharedPtr<FJsonObject>& Data);
    void HandleSetTrait(const TSharedPtr<FJsonObject>& Data);
    void HandleSetAtmosphere(const TSharedPtr<FJsonObject>& Data);
    void HandleSpawnSettlement(const TSharedPtr<FJsonObject>& Data);
    void HandleSyncWorldState(const TSharedPtr<FJsonObject>& Data);
};
