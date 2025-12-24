using UnrealBuildTool;
using System.Collections.Generic;

public class WorldForgeGameTarget : TargetRules
{
	public WorldForgeGameTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("WorldForgeGame");
	}
}
