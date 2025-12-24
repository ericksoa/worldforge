#include "WorldForgeWebSocketServer.h"
#include "WorldForgeSubsystem.h"
#include "SocketSubsystem.h"
#include "Sockets.h"
#include "Networking.h"
#include "Async/Async.h"

void UWorldForgeWebSocketServer::Initialize(UWorldForgeSubsystem* InOwner)
{
    Owner = InOwner;
}

void UWorldForgeWebSocketServer::Shutdown()
{
    StopServer();
    Owner = nullptr;
}

bool UWorldForgeWebSocketServer::StartServer(int32 Port)
{
    if (bIsRunning)
    {
        return true;
    }

    ServerPort = Port;
    bShouldStop = false;

    // Create the listener socket
    ISocketSubsystem* SocketSubsystem = ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM);
    if (!SocketSubsystem)
    {
        UE_LOG(LogTemp, Error, TEXT("WorldForge: Failed to get socket subsystem"));
        return false;
    }

    ListenerSocket = SocketSubsystem->CreateSocket(NAME_Stream, TEXT("WorldForge TCP Listener"), false);
    if (!ListenerSocket)
    {
        UE_LOG(LogTemp, Error, TEXT("WorldForge: Failed to create listener socket"));
        return false;
    }

    // Configure socket
    ListenerSocket->SetReuseAddr(true);
    ListenerSocket->SetNonBlocking(true);

    // Bind to port
    TSharedRef<FInternetAddr> Addr = SocketSubsystem->CreateInternetAddr();
    Addr->SetAnyAddress();
    Addr->SetPort(Port);

    if (!ListenerSocket->Bind(*Addr))
    {
        UE_LOG(LogTemp, Error, TEXT("WorldForge: Failed to bind to port %d"), Port);
        SocketSubsystem->DestroySocket(ListenerSocket);
        ListenerSocket = nullptr;
        return false;
    }

    if (!ListenerSocket->Listen(1))
    {
        UE_LOG(LogTemp, Error, TEXT("WorldForge: Failed to listen on port %d"), Port);
        SocketSubsystem->DestroySocket(ListenerSocket);
        ListenerSocket = nullptr;
        return false;
    }

    bIsRunning = true;

    // Start the listener thread
    Thread = FRunnableThread::Create(this, TEXT("WorldForge TCP Server"), 0, TPri_Normal);

    UE_LOG(LogTemp, Log, TEXT("WorldForge: TCP server listening on port %d"), Port);
    return true;
}

void UWorldForgeWebSocketServer::StopServer()
{
    bShouldStop = true;

    if (Thread)
    {
        Thread->WaitForCompletion();
        delete Thread;
        Thread = nullptr;
    }

    ISocketSubsystem* SocketSubsystem = ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM);
    if (SocketSubsystem)
    {
        if (ClientSocket)
        {
            ClientSocket->Close();
            SocketSubsystem->DestroySocket(ClientSocket);
            ClientSocket = nullptr;
        }

        if (ListenerSocket)
        {
            ListenerSocket->Close();
            SocketSubsystem->DestroySocket(ListenerSocket);
            ListenerSocket = nullptr;
        }
    }

    bIsRunning = false;
    UE_LOG(LogTemp, Log, TEXT("WorldForge: TCP server stopped"));
}

uint32 UWorldForgeWebSocketServer::Run()
{
    TArray<uint8> ReceiveBuffer;
    ReceiveBuffer.SetNumUninitialized(65536);
    FString PartialMessage;

    while (!bShouldStop)
    {
        // Check for new connections
        if (!ClientSocket && ListenerSocket)
        {
            bool bHasPendingConnection = false;
            if (ListenerSocket->HasPendingConnection(bHasPendingConnection) && bHasPendingConnection)
            {
                ClientSocket = ListenerSocket->Accept(TEXT("WorldForge Client"));
                if (ClientSocket)
                {
                    ClientSocket->SetNonBlocking(true);
                    UE_LOG(LogTemp, Log, TEXT("WorldForge: Client connected"));

                    // Send welcome message
                    FString Welcome = TEXT("{\"type\":\"CONNECTED\",\"message\":\"WorldForge UE5 Ready\"}\n");
                    int32 BytesSent = 0;
                    ClientSocket->Send((uint8*)TCHAR_TO_UTF8(*Welcome), Welcome.Len(), BytesSent);
                }
            }
        }

        // Read from client
        if (ClientSocket)
        {
            uint32 PendingDataSize = 0;
            if (ClientSocket->HasPendingData(PendingDataSize) && PendingDataSize > 0)
            {
                int32 BytesRead = 0;
                if (ClientSocket->Recv(ReceiveBuffer.GetData(), ReceiveBuffer.Num() - 1, BytesRead))
                {
                    if (BytesRead > 0)
                    {
                        ReceiveBuffer[BytesRead] = 0;
                        FString ReceivedStr = UTF8_TO_TCHAR((char*)ReceiveBuffer.GetData());
                        PartialMessage += ReceivedStr;

                        // Process complete lines (messages end with newline)
                        int32 NewlineIndex;
                        while (PartialMessage.FindChar('\n', NewlineIndex))
                        {
                            FString CompleteLine = PartialMessage.Left(NewlineIndex).TrimStartAndEnd();
                            PartialMessage = PartialMessage.Mid(NewlineIndex + 1);

                            if (!CompleteLine.IsEmpty())
                            {
                                // Process on game thread
                                AsyncTask(ENamedThreads::GameThread, [this, CompleteLine]()
                                {
                                    ProcessReceivedData(CompleteLine);
                                });
                            }
                        }
                    }
                }
                else
                {
                    // Connection lost
                    UE_LOG(LogTemp, Log, TEXT("WorldForge: Client disconnected"));
                    ISocketSubsystem* SocketSubsystem = ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM);
                    if (SocketSubsystem)
                    {
                        SocketSubsystem->DestroySocket(ClientSocket);
                    }
                    ClientSocket = nullptr;
                    PartialMessage.Empty();
                }
            }
        }

        // Small sleep to prevent spinning
        FPlatformProcess::Sleep(0.01f);
    }

    return 0;
}

void UWorldForgeWebSocketServer::ProcessReceivedData(const FString& Data)
{
    UE_LOG(LogTemp, Log, TEXT("WorldForge: Received: %s"), *Data);

    // Forward to subsystem
    if (Owner)
    {
        Owner->ProcessCommand(Data);
    }

    // Broadcast to delegate
    OnMessageReceived.ExecuteIfBound(Data);

    // Send acknowledgment
    if (ClientSocket)
    {
        FString Ack = TEXT("{\"type\":\"ACK\",\"status\":\"ok\"}\n");
        int32 BytesSent = 0;
        ClientSocket->Send((uint8*)TCHAR_TO_UTF8(*Ack), Ack.Len(), BytesSent);
    }
}
