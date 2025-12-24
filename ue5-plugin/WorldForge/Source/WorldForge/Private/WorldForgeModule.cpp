#include "WorldForgeModule.h"

#define LOCTEXT_NAMESPACE "FWorldForgeModule"

void FWorldForgeModule::StartupModule()
{
    UE_LOG(LogTemp, Log, TEXT("WorldForge: Module started"));
}

void FWorldForgeModule::ShutdownModule()
{
    UE_LOG(LogTemp, Log, TEXT("WorldForge: Module shutdown"));
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FWorldForgeModule, WorldForge)
