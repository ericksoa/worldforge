#pragma once

#include "CoreMinimal.h"
#include "WorldForgeTypes.generated.h"

/**
 * World traits that can be modified by tarot card choices
 */
UENUM(BlueprintType)
enum class EWorldForgeTrait : uint8
{
    Militarism    UMETA(DisplayName = "Militarism"),
    Prosperity    UMETA(DisplayName = "Prosperity"),
    Religiosity   UMETA(DisplayName = "Religiosity"),
    Lawfulness    UMETA(DisplayName = "Lawfulness"),
    Openness      UMETA(DisplayName = "Openness")
};

/**
 * World atmosphere types
 */
UENUM(BlueprintType)
enum class EWorldForgeAtmosphere : uint8
{
    WarTorn       UMETA(DisplayName = "War Torn"),
    Prosperous    UMETA(DisplayName = "Prosperous"),
    Mysterious    UMETA(DisplayName = "Mysterious"),
    Sacred        UMETA(DisplayName = "Sacred"),
    Desolate      UMETA(DisplayName = "Desolate"),
    Vibrant       UMETA(DisplayName = "Vibrant")
};

/**
 * Landmark types for world generation
 */
UENUM(BlueprintType)
enum class EWorldForgeLandmarkType : uint8
{
    Settlement    UMETA(DisplayName = "Settlement"),
    Fortress      UMETA(DisplayName = "Fortress"),
    Monastery     UMETA(DisplayName = "Monastery"),
    Ruin          UMETA(DisplayName = "Ruin"),
    Natural       UMETA(DisplayName = "Natural")
};

/**
 * Era information
 */
USTRUCT(BlueprintType)
struct WORLDFORGE_API FWorldForgeEra
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    FString Id;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    FString Name;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    FString Period;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    FString Description;
};

/**
 * Landmark definition
 */
USTRUCT(BlueprintType)
struct WORLDFORGE_API FWorldForgeLandmark
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    FString Id;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    FString Name;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    EWorldForgeLandmarkType Type;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    FString Description;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    FVector Location;
};

/**
 * Complete world state
 */
USTRUCT(BlueprintType)
struct WORLDFORGE_API FWorldForgeState
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    FWorldForgeEra Era;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    float Militarism = 0.5f;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    float Prosperity = 0.5f;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    float Religiosity = 0.5f;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    float Lawfulness = 0.5f;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    float Openness = 0.5f;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    EWorldForgeAtmosphere Atmosphere = EWorldForgeAtmosphere::Mysterious;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "WorldForge")
    TArray<FWorldForgeLandmark> Landmarks;

    // Helper to get trait by enum
    float GetTrait(EWorldForgeTrait Trait) const
    {
        switch (Trait)
        {
        case EWorldForgeTrait::Militarism: return Militarism;
        case EWorldForgeTrait::Prosperity: return Prosperity;
        case EWorldForgeTrait::Religiosity: return Religiosity;
        case EWorldForgeTrait::Lawfulness: return Lawfulness;
        case EWorldForgeTrait::Openness: return Openness;
        default: return 0.5f;
        }
    }

    // Helper to set trait by enum
    void SetTrait(EWorldForgeTrait Trait, float Value)
    {
        Value = FMath::Clamp(Value, 0.0f, 1.0f);
        switch (Trait)
        {
        case EWorldForgeTrait::Militarism: Militarism = Value; break;
        case EWorldForgeTrait::Prosperity: Prosperity = Value; break;
        case EWorldForgeTrait::Religiosity: Religiosity = Value; break;
        case EWorldForgeTrait::Lawfulness: Lawfulness = Value; break;
        case EWorldForgeTrait::Openness: Openness = Value; break;
        }
    }
};

// Delegate declarations
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnWorldStateChanged, const FWorldForgeState&, NewState);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnCommandReceived, const FString&, CommandType, const FString&, CommandData);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnConnectionStatusChanged, bool, bConnected);
