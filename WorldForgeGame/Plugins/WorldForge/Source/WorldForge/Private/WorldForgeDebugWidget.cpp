#include "WorldForgeDebugWidget.h"
#include "Widgets/Layout/SBorder.h"

void UWorldForgeDebugWidget::NativeConstruct()
{
    Super::NativeConstruct();
}

TSharedRef<SWidget> UWorldForgeDebugWidget::RebuildWidget()
{
    // Create the main container
    return SNew(SBorder)
        .BorderBackgroundColor(FLinearColor(0.0f, 0.0f, 0.0f, 0.7f))
        .Padding(FMargin(10.0f))
        [
            SNew(SVerticalBox)

            // Header
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 0, 0, 5)
            [
                SNew(STextBlock)
                .Text(FText::FromString(TEXT("WorldForge Debug")))
                .ColorAndOpacity(FLinearColor(1.0f, 0.8f, 0.2f))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 14))
            ]

            // Connection Status
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 0, 0, 5)
            [
                SNew(SHorizontalBox)
                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SNew(STextBlock)
                    .Text(FText::FromString(TEXT("Status: ")))
                    .ColorAndOpacity(FLinearColor::Gray)
                ]
                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SAssignNew(ConnectionStatusText, STextBlock)
                    .Text(FText::FromString(TEXT("Disconnected")))
                    .ColorAndOpacity(FLinearColor::Red)
                ]
            ]

            // Era
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 0, 0, 2)
            [
                SNew(SHorizontalBox)
                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SNew(STextBlock)
                    .Text(FText::FromString(TEXT("Era: ")))
                    .ColorAndOpacity(FLinearColor::Gray)
                ]
                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SAssignNew(EraText, STextBlock)
                    .Text(FText::FromString(TEXT("None")))
                    .ColorAndOpacity(FLinearColor::White)
                ]
            ]

            // Atmosphere
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 0, 0, 10)
            [
                SNew(SHorizontalBox)
                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SNew(STextBlock)
                    .Text(FText::FromString(TEXT("Atmosphere: ")))
                    .ColorAndOpacity(FLinearColor::Gray)
                ]
                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SAssignNew(AtmosphereText, STextBlock)
                    .Text(FText::FromString(TEXT("Neutral")))
                    .ColorAndOpacity(FLinearColor::White)
                ]
            ]

            // Traits Header
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 0, 0, 5)
            [
                SNew(STextBlock)
                .Text(FText::FromString(TEXT("World Traits")))
                .ColorAndOpacity(FLinearColor(0.8f, 0.8f, 0.8f))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 11))
            ]

            // Trait Bars
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                CreateTraitRow(TEXT("Militarism"), MilitarismBar, MilitarismText)
            ]
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                CreateTraitRow(TEXT("Prosperity"), ProsperityBar, ProsperityText)
            ]
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                CreateTraitRow(TEXT("Religiosity"), ReligiosityBar, ReligiosityText)
            ]
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                CreateTraitRow(TEXT("Lawfulness"), LawfulnessBar, LawfulnessText)
            ]
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                CreateTraitRow(TEXT("Openness"), OpennessBar, OpennessText)
            ]
        ];
}

TSharedRef<SWidget> UWorldForgeDebugWidget::CreateTraitRow(
    const FString& Label,
    TSharedPtr<SProgressBar>& OutBar,
    TSharedPtr<STextBlock>& OutText)
{
    return SNew(SHorizontalBox)
        .Clipping(EWidgetClipping::ClipToBounds)

        // Label
        + SHorizontalBox::Slot()
        .AutoWidth()
        .VAlign(VAlign_Center)
        .Padding(0, 2, 10, 2)
        [
            SNew(SBox)
            .WidthOverride(80.0f)
            [
                SNew(STextBlock)
                .Text(FText::FromString(Label))
                .ColorAndOpacity(FLinearColor::Gray)
            ]
        ]

        // Progress Bar
        + SHorizontalBox::Slot()
        .FillWidth(1.0f)
        .VAlign(VAlign_Center)
        .Padding(0, 2)
        [
            SNew(SBox)
            .WidthOverride(120.0f)
            .HeightOverride(16.0f)
            [
                SAssignNew(OutBar, SProgressBar)
                .Percent(0.5f)
                .FillColorAndOpacity(FLinearColor(0.2f, 0.6f, 0.9f))
                .BackgroundImage(FCoreStyle::Get().GetBrush("ProgressBar.Background"))
            ]
        ]

        // Value Text
        + SHorizontalBox::Slot()
        .AutoWidth()
        .VAlign(VAlign_Center)
        .Padding(10, 2, 0, 2)
        [
            SNew(SBox)
            .WidthOverride(40.0f)
            [
                SAssignNew(OutText, STextBlock)
                .Text(FText::FromString(TEXT("0.50")))
                .ColorAndOpacity(FLinearColor::White)
            ]
        ];
}

void UWorldForgeDebugWidget::UpdateWorldState(const FWorldForgeState& NewState)
{
    if (MilitarismBar.IsValid())
    {
        MilitarismBar->SetPercent(NewState.Militarism);
        MilitarismText->SetText(FText::FromString(FString::Printf(TEXT("%.2f"), NewState.Militarism)));
    }

    if (ProsperityBar.IsValid())
    {
        ProsperityBar->SetPercent(NewState.Prosperity);
        ProsperityText->SetText(FText::FromString(FString::Printf(TEXT("%.2f"), NewState.Prosperity)));
    }

    if (ReligiosityBar.IsValid())
    {
        ReligiosityBar->SetPercent(NewState.Religiosity);
        ReligiosityText->SetText(FText::FromString(FString::Printf(TEXT("%.2f"), NewState.Religiosity)));
    }

    if (LawfulnessBar.IsValid())
    {
        LawfulnessBar->SetPercent(NewState.Lawfulness);
        LawfulnessText->SetText(FText::FromString(FString::Printf(TEXT("%.2f"), NewState.Lawfulness)));
    }

    if (OpennessBar.IsValid())
    {
        OpennessBar->SetPercent(NewState.Openness);
        OpennessText->SetText(FText::FromString(FString::Printf(TEXT("%.2f"), NewState.Openness)));
    }

    if (EraText.IsValid() && !NewState.Era.Name.IsEmpty())
    {
        EraText->SetText(FText::FromString(NewState.Era.Name));
    }

    if (AtmosphereText.IsValid())
    {
        AtmosphereText->SetText(FText::FromString(GetAtmosphereName(NewState.Atmosphere)));
    }
}

void UWorldForgeDebugWidget::SetConnectionStatus(bool bConnected)
{
    if (ConnectionStatusText.IsValid())
    {
        if (bConnected)
        {
            ConnectionStatusText->SetText(FText::FromString(TEXT("Connected")));
            ConnectionStatusText->SetColorAndOpacity(FLinearColor::Green);
        }
        else
        {
            ConnectionStatusText->SetText(FText::FromString(TEXT("Disconnected")));
            ConnectionStatusText->SetColorAndOpacity(FLinearColor::Red);
        }
    }
}

FString UWorldForgeDebugWidget::GetAtmosphereName(EWorldForgeAtmosphere Atmosphere) const
{
    switch (Atmosphere)
    {
        case EWorldForgeAtmosphere::WarTorn: return TEXT("War-Torn");
        case EWorldForgeAtmosphere::Prosperous: return TEXT("Prosperous");
        case EWorldForgeAtmosphere::Mysterious: return TEXT("Mysterious");
        case EWorldForgeAtmosphere::Sacred: return TEXT("Sacred");
        case EWorldForgeAtmosphere::Desolate: return TEXT("Desolate");
        case EWorldForgeAtmosphere::Vibrant: return TEXT("Vibrant");
        default: return TEXT("Unknown");
    }
}
