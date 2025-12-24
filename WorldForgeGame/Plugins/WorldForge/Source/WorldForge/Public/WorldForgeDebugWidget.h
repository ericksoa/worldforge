#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "Widgets/Text/STextBlock.h"
#include "Widgets/Notifications/SProgressBar.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/SBoxPanel.h"
#include "WorldForgeTypes.h"
#include "WorldForgeDebugWidget.generated.h"

/**
 * Debug overlay widget that displays the current WorldForge state
 * Shows all world traits as labeled progress bars
 */
UCLASS()
class WORLDFORGE_API UWorldForgeDebugWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    /** Update the display with new world state */
    UFUNCTION(BlueprintCallable, Category = "WorldForge")
    void UpdateWorldState(const FWorldForgeState& NewState);

    /** Set connection status display */
    UFUNCTION(BlueprintCallable, Category = "WorldForge")
    void SetConnectionStatus(bool bConnected);

protected:
    virtual void NativeConstruct() override;
    virtual TSharedRef<SWidget> RebuildWidget() override;

private:
    /** Container for trait displays */
    TSharedPtr<SVerticalBox> TraitsContainer;

    /** Connection status text */
    TSharedPtr<STextBlock> ConnectionStatusText;

    /** Era display text */
    TSharedPtr<STextBlock> EraText;

    /** Atmosphere display text */
    TSharedPtr<STextBlock> AtmosphereText;

    /** Progress bars for each trait */
    TSharedPtr<SProgressBar> MilitarismBar;
    TSharedPtr<SProgressBar> ProsperityBar;
    TSharedPtr<SProgressBar> ReligiosityBar;
    TSharedPtr<SProgressBar> LawfulnessBar;
    TSharedPtr<SProgressBar> OpennessBar;

    /** Trait value text blocks */
    TSharedPtr<STextBlock> MilitarismText;
    TSharedPtr<STextBlock> ProsperityText;
    TSharedPtr<STextBlock> ReligiosityText;
    TSharedPtr<STextBlock> LawfulnessText;
    TSharedPtr<STextBlock> OpennessText;

    /** Helper to create a trait row */
    TSharedRef<SWidget> CreateTraitRow(
        const FString& Label,
        TSharedPtr<SProgressBar>& OutBar,
        TSharedPtr<STextBlock>& OutText);

    /** Helper to get atmosphere name */
    FString GetAtmosphereName(EWorldForgeAtmosphere Atmosphere) const;
};
