#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "WorldForgeTypes.h"
#include "WorldForgeSettlementActor.generated.h"

class UStaticMeshComponent;
class UBillboardComponent;
class USphereComponent;
class UTextRenderComponent;

/**
 * Base actor for all WorldForge landmarks/settlements.
 * Spawned by the WorldForge subsystem when SPAWN_SETTLEMENT commands are received.
 */
UCLASS(BlueprintType, Blueprintable)
class WORLDFORGE_API AWorldForgeSettlementActor : public AActor
{
    GENERATED_BODY()

public:
    AWorldForgeSettlementActor();

    /** Initialize the actor with landmark data */
    UFUNCTION(BlueprintCallable, Category = "WorldForge")
    void InitializeFromLandmark(const FWorldForgeLandmark& Landmark);

    /** Get the landmark data */
    UFUNCTION(BlueprintPure, Category = "WorldForge")
    FWorldForgeLandmark GetLandmarkData() const { return LandmarkData; }

protected:
    virtual void BeginPlay() override;

    // ========== Components ==========

    /** Root scene component for positioning */
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    TObjectPtr<USceneComponent> SceneRoot;

    /** Visual representation mesh */
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    TObjectPtr<UStaticMeshComponent> MeshComponent;

    /** Text label showing settlement name */
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    TObjectPtr<UTextRenderComponent> NameLabel;

    // ========== Data ==========

    /** Landmark data from Electron */
    UPROPERTY(BlueprintReadOnly, Category = "WorldForge")
    FWorldForgeLandmark LandmarkData;

    /** Update visual based on landmark type */
    UFUNCTION(BlueprintNativeEvent, Category = "WorldForge")
    void UpdateVisuals();

private:
    /** Get color for landmark type */
    FLinearColor GetColorForType(EWorldForgeLandmarkType Type) const;

    /** Get scale for landmark type */
    FVector GetScaleForType(EWorldForgeLandmarkType Type) const;
};
