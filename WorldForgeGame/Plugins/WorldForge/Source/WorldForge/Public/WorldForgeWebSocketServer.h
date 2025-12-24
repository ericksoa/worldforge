#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "HAL/Runnable.h"
#include "Sockets.h"
#include "WorldForgeWebSocketServer.generated.h"

class UWorldForgeSubsystem;
class FSocket;
class FTcpListener;

DECLARE_DELEGATE_OneParam(FOnWorldForgeMessage, const FString&);

/**
 * TCP Server for receiving commands from the WorldForge Electron app.
 * Uses simple TCP with JSON messages (one JSON object per line).
 */
UCLASS()
class WORLDFORGE_API UWorldForgeWebSocketServer : public UObject, public FRunnable
{
    GENERATED_BODY()

public:
    void Initialize(UWorldForgeSubsystem* InOwner);
    void Shutdown();

    bool StartServer(int32 Port);
    void StopServer();
    bool IsRunning() const { return bIsRunning; }

    FOnWorldForgeMessage OnMessageReceived;

    // FRunnable interface
    virtual bool Init() override { return true; }
    virtual uint32 Run() override;
    virtual void Stop() override { bShouldStop = true; }

private:
    UPROPERTY()
    TObjectPtr<UWorldForgeSubsystem> Owner;

    FSocket* ListenerSocket = nullptr;
    FSocket* ClientSocket = nullptr;
    FRunnableThread* Thread = nullptr;

    bool bIsRunning = false;
    bool bShouldStop = false;
    int32 ServerPort = 8765;

    void ProcessReceivedData(const FString& Data);
};
