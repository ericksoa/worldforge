#include "WorldForgeSettlementActor.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

AWorldForgeSettlementActor::AWorldForgeSettlementActor()
{
    PrimaryActorTick.bCanEverTick = false;

    // Create root component
    SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
    SetRootComponent(SceneRoot);

    // Create mesh component with default cube
    MeshComponent = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MeshComponent"));
    MeshComponent->SetupAttachment(SceneRoot);
    MeshComponent->SetRelativeLocation(FVector(0.0f, 0.0f, 50.0f)); // Offset up from ground

    // Load default cube mesh
    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube"));
    if (CubeMesh.Succeeded())
    {
        MeshComponent->SetStaticMesh(CubeMesh.Object);
    }

    // Create name label
    NameLabel = CreateDefaultSubobject<UTextRenderComponent>(TEXT("NameLabel"));
    NameLabel->SetupAttachment(SceneRoot);
    NameLabel->SetRelativeLocation(FVector(0.0f, 0.0f, 3500.0f)); // Above the mesh
    NameLabel->SetHorizontalAlignment(EHTA_Center);
    NameLabel->SetVerticalAlignment(EVRTA_TextCenter);
    NameLabel->SetWorldSize(500.0f); // Large text visible from distance
    NameLabel->SetTextRenderColor(FColor::White);
}

void AWorldForgeSettlementActor::BeginPlay()
{
    Super::BeginPlay();
}

void AWorldForgeSettlementActor::InitializeFromLandmark(const FWorldForgeLandmark& Landmark)
{
    LandmarkData = Landmark;

    // Set the name label
    if (NameLabel)
    {
        NameLabel->SetText(FText::FromString(Landmark.Name));
    }

    UpdateVisuals();
}

void AWorldForgeSettlementActor::UpdateVisuals_Implementation()
{
    if (!MeshComponent)
    {
        return;
    }

    // Get color and scale for this type
    FLinearColor TypeColor = GetColorForType(LandmarkData.Type);
    FVector TypeScale = GetScaleForType(LandmarkData.Type);

    // Apply scale
    MeshComponent->SetRelativeScale3D(TypeScale);

    // Create dynamic material instance with the appropriate color
    UMaterialInterface* BaseMaterial = MeshComponent->GetMaterial(0);
    if (BaseMaterial)
    {
        UMaterialInstanceDynamic* DynMaterial = UMaterialInstanceDynamic::Create(BaseMaterial, this);
        if (DynMaterial)
        {
            // Try common parameter names for base color
            DynMaterial->SetVectorParameterValue(TEXT("BaseColor"), TypeColor);
            DynMaterial->SetVectorParameterValue(TEXT("Base Color"), TypeColor);
            DynMaterial->SetVectorParameterValue(TEXT("Color"), TypeColor);
            MeshComponent->SetMaterial(0, DynMaterial);
        }
    }

    // Also try setting the mesh color directly (for simple materials)
    MeshComponent->SetCustomPrimitiveDataFloat(0, TypeColor.R);
    MeshComponent->SetCustomPrimitiveDataFloat(1, TypeColor.G);
    MeshComponent->SetCustomPrimitiveDataFloat(2, TypeColor.B);

    UE_LOG(LogTemp, Log, TEXT("WorldForge: Settlement '%s' visuals updated - Type: %d, Color: R=%.2f G=%.2f B=%.2f"),
           *LandmarkData.Name,
           static_cast<int32>(LandmarkData.Type),
           TypeColor.R, TypeColor.G, TypeColor.B);
}

FLinearColor AWorldForgeSettlementActor::GetColorForType(EWorldForgeLandmarkType Type) const
{
    switch (Type)
    {
    case EWorldForgeLandmarkType::Settlement:
        return FLinearColor(0.55f, 0.27f, 0.07f); // Brown (wood)

    case EWorldForgeLandmarkType::Fortress:
        return FLinearColor(0.5f, 0.5f, 0.5f); // Gray (stone)

    case EWorldForgeLandmarkType::Monastery:
        return FLinearColor(1.0f, 0.84f, 0.0f); // Gold

    case EWorldForgeLandmarkType::Ruin:
        return FLinearColor(0.4f, 0.5f, 0.3f); // Mossy green

    case EWorldForgeLandmarkType::Natural:
        return FLinearColor(0.2f, 0.6f, 0.8f); // Blue-green (water/forest)

    default:
        return FLinearColor::White;
    }
}

FVector AWorldForgeSettlementActor::GetScaleForType(EWorldForgeLandmarkType Type) const
{
    // Default cube is 100 units - scale up to be visible in typical UE5 levels
    switch (Type)
    {
    case EWorldForgeLandmarkType::Settlement:
        return FVector(20.0f, 20.0f, 15.0f); // Wide and low (~2000x2000x1500 units)

    case EWorldForgeLandmarkType::Fortress:
        return FVector(25.0f, 25.0f, 30.0f); // Tall and imposing (~2500x2500x3000 units)

    case EWorldForgeLandmarkType::Monastery:
        return FVector(15.0f, 30.0f, 20.0f); // Long building shape

    case EWorldForgeLandmarkType::Ruin:
        return FVector(15.0f, 15.0f, 8.0f); // Broken/low

    case EWorldForgeLandmarkType::Natural:
        return FVector(10.0f, 10.0f, 10.0f); // Standard sphere-ish

    default:
        return FVector(10.0f, 10.0f, 10.0f);
    }
}
