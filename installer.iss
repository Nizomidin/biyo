; Biyo/Serkor Installer Script
; This script packages both the backend and Tauri desktop app

#define MyAppName "Serkor"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "Biyo Dental"
#define MyAppExeName "Serkor.exe"
#define MyBackendExeName "biyo-backend.exe"
#define MyAppMSI "Serkor_0.1.0_x64_en-US.msi"
#define MyAppURL "https://github.com/yourusername/biyo"

[Setup]
AppId={{8F3B2C1A-9D4E-4B5C-A6F7-1E8D9C2B3A4F}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=
InfoBeforeFile=
InfoAfterFile=
OutputDir=Output
OutputBaseFilename=SerkorSetup-{#MyAppVersion}
SetupIconFile=src-tauri\icons\icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startbackend"; Description: "Запустить backend автоматически при запуске приложения"; GroupDescription: "Дополнительные опции:"; Flags: checkedonce

[Files]
; Backend executable
Source: "installer-output\{#MyBackendExeName}"; DestDir: "{app}\backend"; Flags: ignoreversion

; Tauri application - adjust path based on your Tauri build output
Source: "src-tauri\target\release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
; If Tauri creates a bundle directory, you might need to include additional files:
; Source: "src-tauri\target\release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; Launcher script
Source: "launcher.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\launcher.bat"; IconFilename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\launcher.bat"; IconFilename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\launcher.bat"; IconFilename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\launcher.bat"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
var
  BackendProcess: Integer;

procedure InitializeWizard();
begin
  // Custom initialization if needed
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Any post-install setup
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    // Kill backend process if running
    Exec('taskkill', '/F /IM {#MyBackendExeName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
