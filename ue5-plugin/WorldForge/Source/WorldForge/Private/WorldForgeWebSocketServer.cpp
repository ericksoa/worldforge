#include "WorldForgeWebSocketServer.h"
#include "WorldForgeSubsystem.h"
#include "WebSocketsModule.h"
#include "IWebSocketServer.h"

void UWorldForgeWebSocketServer::Initialize(UWorldForgeSubsystem* InOwner)
{
    Owner = InOwner;
}

void UWorldForgeWebSocketServer::Shutdown()
{
    Stop();
    Owner = nullptr;
}

bool UWorldForgeWebSocketServer::Start(int32 Port)
{
    if (bIsRunning)
    {
        return true;
    }

    // Create WebSocket server
    FWebSocketsModule& WebSocketsModule = FModuleManager::LoadModuleChecked<FWebSocketsModule>(TEXT("WebSockets"));

    Server = WebSocketsModule.CreateServer();
    if (!Server.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("WorldForge: Failed to create WebSocket server"));
        return false;
    }

    // Bind callbacks
    Server->OnClientConnected().AddLambda([this](FGuid ClientId)
    {
        OnClientConnected(ClientId);
    });

    Server->OnClientDisconnected().AddLambda([this](FGuid ClientId)
    {
        OnClientDisconnected(ClientId);
    });

    Server->OnMessage().AddLambda([this](FGuid ClientId, const FString& Message)
    {
        OnMessage(ClientId, Message);
    });

    // Start listening
    if (!Server->Start(Port))
    {
        UE_LOG(LogTemp, Error, TEXT("WorldForge: Failed to start WebSocket server on port %d"), Port);
        Server.Reset();
        return false;
    }

    bIsRunning = true;
    UE_LOG(LogTemp, Log, TEXT("WorldForge: WebSocket server listening on port %d"), Port);
    return true;
}

void UWorldForgeWebSocketServer::Stop()
{
    if (!bIsRunning || !Server.IsValid())
    {
        return;
    }

    Server->Stop();
    Server.Reset();
    ConnectedClients.Empty();
    bIsRunning = false;

    UE_LOG(LogTemp, Log, TEXT("WorldForge: WebSocket server stopped"));
}

void UWorldForgeWebSocketServer::OnClientConnected(FGuid ClientId)
{
    ConnectedClients.Add(ClientId);
    UE_LOG(LogTemp, Log, TEXT("WorldForge: Client connected - %s (Total: %d)"),
        *ClientId.ToString(), ConnectedClients.Num());

    // Send welcome message
    if (Server.IsValid())
    {
        FString WelcomeMessage = TEXT("{\"type\":\"CONNECTED\",\"message\":\"WorldForge UE5 Plugin Ready\"}");
        Server->Send(ClientId, WelcomeMessage);
    }
}

void UWorldForgeWebSocketServer::OnClientDisconnected(FGuid ClientId)
{
    ConnectedClients.Remove(ClientId);
    UE_LOG(LogTemp, Log, TEXT("WorldForge: Client disconnected - %s (Remaining: %d)"),
        *ClientId.ToString(), ConnectedClients.Num());
}

void UWorldForgeWebSocketServer::OnMessage(FGuid ClientId, const FString& Message)
{
    UE_LOG(LogTemp, Verbose, TEXT("WorldForge: Message from %s: %s"),
        *ClientId.ToString(), *Message);

    // Forward to subsystem for processing
    if (Owner)
    {
        Owner->ProcessCommand(Message);
    }

    // Broadcast to delegate
    OnMessageReceived.ExecuteIfBound(Message);

    // Send acknowledgment
    if (Server.IsValid())
    {
        FString AckMessage = TEXT("{\"type\":\"ACK\",\"status\":\"ok\"}");
        Server->Send(ClientId, AckMessage);
    }
}
