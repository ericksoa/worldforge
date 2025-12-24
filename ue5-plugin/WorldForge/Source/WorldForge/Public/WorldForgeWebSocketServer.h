#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "IWebSocketServer.h"
#include "WorldForgeWebSocketServer.generated.h"

class UWorldForgeSubsystem;

DECLARE_DELEGATE_OneParam(FOnWebSocketMessage, const FString&);

/**
 * WebSocket server for receiving commands from the WorldForge Electron app
 */
UCLASS()
class WORLDFORGE_API UWorldForgeWebSocketServer : public UObject
{
    GENERATED_BODY()

public:
    void Initialize(UWorldForgeSubsystem* InOwner);
    void Shutdown();

    bool Start(int32 Port);
    void Stop();
    bool IsRunning() const { return bIsRunning; }

    FOnWebSocketMessage OnMessageReceived;

private:
    UPROPERTY()
    TObjectPtr<UWorldForgeSubsystem> Owner;

    TSharedPtr<IWebSocketServer> Server;
    TArray<FGuid> ConnectedClients;
    bool bIsRunning = false;

    void OnClientConnected(FGuid ClientId);
    void OnClientDisconnected(FGuid ClientId);
    void OnMessage(FGuid ClientId, const FString& Message);
};
