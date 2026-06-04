import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, Switch, Text, View } from 'react-native';

import { AppLogo } from '@/components/app/app-logo';
import { AppHeader } from '@/components/app/shared';
import { Chip, Section, SettingRow } from '@/components/ui/primitives';
import { useAppPalette, useThemePreference, type ThemePreference } from '@/hooks/use-theme-preference';
import { APP_BUILD, APP_NAME, APP_VERSION } from '@/lib/app-info';
import { type AccentColor, spacing } from '@/lib/palette';

const themes: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const accentOptions: { label: string; value: AccentColor }[] = [
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Amber', value: 'amber' },
];

function Notice({ children, title }: { children: string; title: string }) {
  const palette = useAppPalette();

  return (
    <View style={{ gap: 6, padding: spacing.md }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
        <MaterialIcons color={palette.accent} name="info-outline" size={18} />
        <Text style={{ color: palette.text, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      </View>
      <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 19 }}>{children}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const palette = useAppPalette();
  const { appPreferences, preference, setAppPreference, setPreference } = useThemePreference();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ gap: 16, minHeight: '100%', padding: 16, paddingBottom: 32 }}>
      <AppHeader
        palette={palette}
        subtitle="Appearance, downloads, reading defaults, and app info."
        title="Settings"
      />

      <Section palette={palette} title="Downloads & sync">
        <Notice title="Large repos need time">
          Cloning downloads a ZIP from GitHub, then extracts every file on your device. Big repositories can take
          several minutes on slow Wi‑Fi or mobile data. Keep KodeView open until the progress bar finishes.
        </Notice>
        <Notice title="GitHub rate limits">
          Searching, commit logs, and branches use the public GitHub API. If requests fail, wait a minute and try again.
        </Notice>
        <SettingRow
          detail="Re-download repositories older than 24 hours when you open the app (at most once every 6 hours)."
          icon="sync"
          label="Auto-sync"
          last
          palette={palette}>
          <Switch
            onValueChange={(value) => setAppPreference('autoSync', value)}
            trackColor={{ false: palette.secondary, true: palette.accent }}
            value={appPreferences.autoSync}
          />
        </SettingRow>
      </Section>

      <Section palette={palette} title="Appearance">
        <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md }}>
          {themes.map((theme) => (
            <Chip key={theme.value} onPress={() => setPreference(theme.value)} palette={palette} selected={preference === theme.value}>
              {theme.label}
            </Chip>
          ))}
        </View>
        <View style={{ borderTopColor: palette.border, borderTopWidth: 1, gap: spacing.sm, padding: spacing.md }}>
          <Text style={{ color: palette.text, fontSize: 14, fontWeight: '700' }}>Accent color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {accentOptions.map((option) => (
              <Chip
                key={option.value}
                onPress={() => setAppPreference('accentColor', option.value)}
                palette={palette}
                selected={appPreferences.accentColor === option.value}>
                {option.label}
              </Chip>
            ))}
          </View>
        </View>
      </Section>

      <Section palette={palette} title="Code display">
        <SettingRow
          detail="Wrap long lines instead of horizontal scrolling."
          icon="wrap-text"
          label="Wrap code by default"
          palette={palette}>
          <Switch
            onValueChange={(value) => setAppPreference('wrapCodeByDefault', value)}
            trackColor={{ false: palette.secondary, true: palette.accent }}
            value={appPreferences.wrapCodeByDefault}
          />
        </SettingRow>
        <SettingRow
          detail="Show gutter numbers in code files."
          icon="format-list-numbered"
          label="Line numbers"
          palette={palette}>
          <Switch
            onValueChange={(value) => setAppPreference('showLineNumbers', value)}
            trackColor={{ false: palette.secondary, true: palette.accent }}
            value={appPreferences.showLineNumbers}
          />
        </SettingRow>
        <SettingRow detail="Starting font size for the reader." icon="text-fields" label="Default font size" palette={palette}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Text
              onPress={() => setAppPreference('defaultCodeFontSize', Math.max(11, appPreferences.defaultCodeFontSize - 1))}
              style={{ color: palette.accent, fontSize: 18, fontWeight: '900' }}>
              −
            </Text>
            <Text style={{ color: palette.text, fontSize: 15, fontWeight: '800', minWidth: 24, textAlign: 'center' }}>
              {appPreferences.defaultCodeFontSize}
            </Text>
            <Text
              onPress={() => setAppPreference('defaultCodeFontSize', Math.min(18, appPreferences.defaultCodeFontSize + 1))}
              style={{ color: palette.accent, fontSize: 18, fontWeight: '900' }}>
              +
            </Text>
          </View>
        </SettingRow>
        <SettingRow
          detail="Use tighter rows in repository file trees."
          icon="density-small"
          label="Compact file tree"
          last
          palette={palette}>
          <Switch
            onValueChange={(value) => setAppPreference('compactExplorer', value)}
            trackColor={{ false: palette.secondary, true: palette.accent }}
            value={appPreferences.compactExplorer}
          />
        </SettingRow>
      </Section>

      <Section palette={palette} title="Markdown">
        <SettingRow
          detail="Open README and docs in rendered preview first."
          icon="article"
          label="Markdown preview default"
          last
          palette={palette}>
          <Switch
            onValueChange={(value) => setAppPreference('markdownPreviewDefault', value)}
            trackColor={{ false: palette.secondary, true: palette.accent }}
            value={appPreferences.markdownPreviewDefault}
          />
        </SettingRow>
      </Section>

      <Section palette={palette} title="Repository behavior">
        <SettingRow
          detail="Open README automatically when entering a repository."
          icon="auto-stories"
          label="Auto-open README"
          palette={palette}>
          <Switch
            onValueChange={(value) => setAppPreference('autoOpenReadme', value)}
            trackColor={{ false: palette.secondary, true: palette.accent }}
            value={appPreferences.autoOpenReadme}
          />
        </SettingRow>
        <SettingRow
          detail="Show file sizes in the explorer tree."
          icon="storage"
          label="File sizes in tree"
          last
          palette={palette}>
          <Switch
            onValueChange={(value) => setAppPreference('showFileSizes', value)}
            trackColor={{ false: palette.secondary, true: palette.accent }}
            value={appPreferences.showFileSizes}
          />
        </SettingRow>
      </Section>

      <Section palette={palette} title={`About ${APP_NAME}`}>
        <View style={{ alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
          <AppLogo size={72} />
          <Text style={{ color: palette.text, fontSize: 22, fontWeight: '900' }}>{APP_NAME}</Text>
          <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
            A lightweight offline code viewer for public GitHub repositories. Clone, browse, and read source files with
            syntax highlighting and Markdown preview.
          </Text>
        </View>
        <SettingRow detail="Marketing version shown in stores." icon="sell" label="App version" palette={palette}>
          <Text style={{ color: palette.text, fontSize: 14, fontWeight: '700' }}>{APP_VERSION}</Text>
        </SettingRow>
      </Section>
    </ScrollView>
  );
}
