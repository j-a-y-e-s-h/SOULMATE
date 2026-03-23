import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Loader2,
  Lock,
  LogOut,
  Shield,
  Trash2,
  UserX,
  MessageSquare,
  Eye,
  Mail,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  getPasswordRequirementChecks,
  getPasswordValidationMessage,
  normalizeEmailAddress,
} from '@/lib/passwordSecurity';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { StyledSelectField, type StyledSelectOption } from '@/components/StyledSelectField';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { User } from '@/types';

type SettingsState = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  matchNotifications: boolean;
  messageNotifications: boolean;
  profileVisibility: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>['privacy']['profileVisibility'];
  photoVisibility: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>['privacy']['photoVisibility'];
  contactPermission: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>['privacy']['contactPermission'];
  showOnlineStatus: boolean;
  showLastActive: boolean;
  allowVisitorAlerts: boolean;
  hideFromFreeMembers: boolean;
  verifiedOnly: boolean;
  language: string;
  readReceipts: boolean;
  typingIndicators: boolean;
  mediaAutoDownload: boolean;
  theme: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>['appearance']['theme'];
};

type ToggleSettingKey =
  | 'emailNotifications'
  | 'pushNotifications'
  | 'matchNotifications'
  | 'messageNotifications'
  | 'showOnlineStatus'
  | 'showLastActive'
  | 'allowVisitorAlerts'
  | 'hideFromFreeMembers'
  | 'verifiedOnly'
  | 'readReceipts'
  | 'typingIndicators'
  | 'mediaAutoDownload';

type ToggleTone = 'rose' | 'sage' | 'sky';
type SensitiveFieldKey =
  | 'passwordCurrent'
  | 'passwordNew'
  | 'passwordConfirm'
  | 'emailCurrent'
  | 'emailNew';

const toggleToneClasses: Record<ToggleTone, string> = {
  rose:
    'data-[state=checked]:bg-[#b84f45] data-[state=checked]:shadow-[0_0_12px_rgba(184,79,69,0.28)] focus-visible:ring-[#b84f45]/20',
  sage:
    'data-[state=checked]:bg-[#4b7165] data-[state=checked]:shadow-[0_0_12px_rgba(75,113,101,0.28)] focus-visible:ring-[#4b7165]/20',
  sky:
    'data-[state=checked]:bg-[#45a1b8] data-[state=checked]:shadow-[0_0_12px_rgba(69,161,184,0.28)] focus-visible:ring-[#45a1b8]/20',
};

const profileVisibilityOptions: StyledSelectOption[] = [
  { value: 'all', label: 'Visible to everyone' },
  { value: 'matching-only', label: 'Accepted matches only' },
  { value: 'hidden', label: 'Private / Hidden' },
];

const photoVisibilityOptions: StyledSelectOption[] = [
  { value: 'all', label: 'Public to all' },
  { value: 'accepted-interest', label: 'Locked until accepted' },
  { value: 'private', label: 'Private (Request only)' },
];

function SettingToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  tone,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  tone: ToggleTone;
}) {
  return (
    <div className="surface-muted rounded-[32px] p-5 transition-colors hover:bg-white/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#1f2330]">{label}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#62584d]">{description}</p>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={label}
          className={`ml-auto h-7 w-12 shrink-0 rounded-full border border-transparent bg-[#d9caba] p-[2px] shadow-inner transition-all duration-300 focus-visible:ring-4 ${toggleToneClasses[tone]}`}
          thumbClassName="size-5 bg-white shadow-[0_2px_12px_rgba(31,35,48,0.18)] duration-300 data-[state=checked]:translate-x-6"
        />
      </div>
    </div>
  );
}

function buildSettingsState(user: User | null): SettingsState {
  return {
    emailNotifications: user?.notifications.email ?? true,
    pushNotifications: user?.notifications.push ?? true,
    matchNotifications: user?.notifications.matches ?? true,
    messageNotifications: user?.notifications.messages ?? true,
    profileVisibility: user?.privacy.profileVisibility || 'matching-only',
    photoVisibility: user?.privacy.photoVisibility || 'accepted-interest',
    contactPermission: user?.privacy.contactPermission || 'accepted-interest',
    showOnlineStatus: user?.privacy.showOnlineStatus ?? true,
    showLastActive: user?.privacy.showLastActive ?? true,
    allowVisitorAlerts: user?.privacy.allowVisitorAlerts ?? true,
    hideFromFreeMembers: user?.privacy.hideFromFreeMembers ?? false,
    verifiedOnly: user?.preferences.verifiedOnly ?? false,
    language: user?.appearance.language || 'en',
    readReceipts: user?.chatDefaults.readReceipts ?? true,
    typingIndicators: user?.chatDefaults.typingIndicators ?? true,
    mediaAutoDownload: user?.chatDefaults.mediaAutoDownload ?? true,
    theme: user?.appearance.theme || 'light',
  };
}

const EMPTY_PASSWORD_CHANGE = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const INITIAL_SENSITIVE_FIELD_STATE: Record<SensitiveFieldKey, boolean> = {
  passwordCurrent: false,
  passwordNew: false,
  passwordConfirm: false,
  emailCurrent: false,
  emailNew: false,
};

export default function Settings() {
  const { user, logout, updatePreferences, updatePrivacy, updateNotifications, updateChatDefaults, updateAppearance, unblockUser, changePassword, changeEmail } = useAuthStore();
  const { getProfileById } = useChatStore();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Account Change States
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD_CHANGE);
  
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [armedSensitiveFields, setArmedSensitiveFields] = useState(INITIAL_SENSITIVE_FIELD_STATE);

  const [settings, setSettings] = useState<SettingsState>(() => buildSettingsState(user ?? null));
  const passwordChecks = getPasswordRequirementChecks(passwordData.newPassword, {
    confirmPassword: passwordData.confirmPassword,
    currentPassword: passwordData.currentPassword,
    email: user?.email,
    requireCurrentDifference: true,
  });

  useEffect(() => {
    if (!user) return;
    setSettings(buildSettingsState(user));
  }, [user]);

  const blockedProfiles = (user?.blockedUsers ?? [])
    .map((profileId) => getProfileById(profileId))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  const toggleSetting = (key: ToggleSettingKey, checked: boolean) => {
    setSettings((prev) => {
      if (prev[key] === checked) {
        return prev;
      }

      toast.success(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} ${checked ? 'enabled' : 'disabled'}`);
      return { ...prev, [key]: checked };
    });
  };

  const handleLogout = () => {
    toast.promise(
      (async () => {
        await logout();
        navigate('/');
      })(),
      {
        loading: 'Logging out...',
        success: 'Logged out successfully',
        error: 'Logout failed',
      }
    );
  };

  const armSensitiveField = (field: SensitiveFieldKey) => {
    setArmedSensitiveFields((previous) =>
      previous[field] ? previous : { ...previous, [field]: true },
    );
  };

  const resetPasswordChangeForm = () => {
    setPasswordData(EMPTY_PASSWORD_CHANGE);
    setArmedSensitiveFields((previous) => ({
      ...previous,
      passwordCurrent: false,
      passwordNew: false,
      passwordConfirm: false,
    }));
  };

  const resetEmailChangeForm = () => {
    setNewEmail('');
    setEmailChangePassword('');
    setArmedSensitiveFields((previous) => ({
      ...previous,
      emailCurrent: false,
      emailNew: false,
    }));
  };

  const togglePasswordChange = () => {
    resetPasswordChangeForm();
    setShowPasswordChange((visible) => !visible);
  };

  const toggleEmailChange = () => {
    resetEmailChangeForm();
    setShowEmailChange((visible) => !visible);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmailAddress(newEmail);

    if (!normalizedEmail) {
      toast.error('Please enter a new email address.');
      return;
    }

    if (!emailChangePassword) {
      toast.error('Enter your current password to confirm this email change.');
      return;
    }

    if (normalizedEmail === user?.email?.toLowerCase()) {
      toast.error('This is already your current email address.');
      return;
    }

    setIsLoading(true);
    const { ok, error } = await changeEmail(normalizedEmail, emailChangePassword, '/settings');
    setIsLoading(false);

    if (!ok) {
      toast.error(error || 'We could not start your email change request.');
      return;
    }

    toast.success(`Verification email sent to ${normalizedEmail}. Confirm it to finish updating your account email.`);
    setShowEmailChange(false);
    resetEmailChangeForm();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      toast.error('Enter your current password before setting a new one.');
      return;
    }

    const validationError = getPasswordValidationMessage(passwordData.newPassword, {
      confirmPassword: passwordData.confirmPassword,
      currentPassword: passwordData.currentPassword,
      email: user?.email,
      requireCurrentDifference: true,
    });

    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    setIsLoading(true);
    const { ok, error } = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    setIsLoading(false);
    
    if (ok) {
      toast.success('Password updated successfully');
      setShowPasswordChange(false);
      resetPasswordChangeForm();
    } else {
      toast.error(error || 'Failed to update password');
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      await Promise.all([
        updatePrivacy({
          profileVisibility: settings.profileVisibility,
          photoVisibility: settings.photoVisibility,
          contactPermission: settings.contactPermission,
          showOnlineStatus: settings.showOnlineStatus,
          showLastActive: settings.showLastActive,
          allowVisitorAlerts: settings.allowVisitorAlerts,
          hideFromFreeMembers: settings.hideFromFreeMembers,
        }),
        updatePreferences({
          verifiedOnly: settings.verifiedOnly,
        }),
        updateNotifications({
          email: settings.emailNotifications,
          push: settings.pushNotifications,
          matches: settings.matchNotifications,
          messages: settings.messageNotifications,
        }),
        updateChatDefaults({
          readReceipts: settings.readReceipts,
          typingIndicators: settings.typingIndicators,
          mediaAutoDownload: settings.mediaAutoDownload,
        }),
        updateAppearance({
          theme: settings.theme as any,
          language: settings.language,
        }),
      ]);

      toast.success('All settings saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'We could not save your settings just now.');
    } finally {
      setIsLoading(false);
    }
  };

  const notificationItems = [
    { key: 'emailNotifications', label: 'Email notifications', description: 'Receive key updates by email.' },
    { key: 'pushNotifications', label: 'Push notifications', description: 'Receive browser and device notifications.' },
    { key: 'matchNotifications', label: 'Interest and match alerts', description: 'Know when someone accepts or sends interest.' },
    { key: 'messageNotifications', label: 'Message notifications', description: 'Stay on top of active chats.' },
  ] as const;

  const privacyItems = [
    { key: 'showOnlineStatus', label: 'Show online status', description: 'Let accepted matches know when you are active.' },
    { key: 'showLastActive', label: 'Show last active', description: 'Display your recent activity state.' },
    { key: 'allowVisitorAlerts', label: 'Visitor alerts', description: 'Get notified when someone views your profile.' },
    { key: 'hideFromFreeMembers', label: 'Hide from free members', description: 'Surface your profile to more serious members first.' },
    { key: 'verifiedOnly', label: 'Browse verified members only', description: 'Apply a trust filter across search and recommendations.' },
  ] as const;

  const chatItems = [
    { key: 'readReceipts', label: 'Read receipts', description: 'Let others know when you have read their messages.' },
    { key: 'typingIndicators', label: 'Typing indicators', description: 'Show when you are typing a message.' },
    { key: 'mediaAutoDownload', label: 'Media auto-download', description: 'Automatically download photos and videos in chats.' },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-5 pb-16 sm:space-y-8 sm:pb-12">
      {/* Header Section */}
      <section className="glass-card overflow-hidden p-5 sm:p-10">
        <div className="relative z-10 grid gap-6 sm:gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-[#b84f45]"></span>
              <span className="eyebrow">User Settings</span>
            </div>
            <h1 className="mt-4 text-[clamp(2.2rem,6vw,3.5rem)] font-bold tracking-tight text-[#1f2330]">
              Control your <span className="text-gradient">Experience</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#62584d] sm:text-lg">
              Manage your visibility, safety, and account preferences. Soulmate puts your privacy and trust at the forefront.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link to="/profile/edit" className="btn-secondary group flex items-center justify-center gap-2 py-4 shadow-sm">
              <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />
              Edit profile
            </Link>
            <button 
              onClick={saveSettings} 
              disabled={isLoading} 
              className="btn-primary group flex items-center justify-center gap-2 py-4 shadow-md transition-all hover:shadow-lg disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 transition-transform group-hover:scale-110" />
              )}
              {isLoading ? 'Saving...' : 'Save all changes'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Notifications & Privacy */}
        <div className="space-y-6 lg:col-span-7">
          {/* Notifications */}
          <div className="glass-card group overflow-hidden p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3e5d6] text-[#b84f45] transition-transform group-hover:rotate-6">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1f2330]">Notifications</h2>
                <p className="text-sm font-medium text-[#8c7c6c]">Stay updated with your matches</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {notificationItems.map((item) => (
                <SettingToggleRow
                  key={item.key}
                  label={item.label}
                  description={item.description}
                  checked={settings[item.key]}
                  onCheckedChange={(checked) => toggleSetting(item.key, checked)}
                  tone="rose"
                />
              ))}
            </div>
          </div>

          {/* Visibility & Rules */}
          <div className="glass-card group p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4efe9] text-[#4b7165] transition-transform group-hover:rotate-6">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1f2330]">Privacy & Visibility</h2>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-medium text-[#8c7c6c]">Who can see you and when</p>
                  <span className="h-1 w-1 rounded-full bg-[#8c7c6c]/30" />
                  <Link to="/rules" className="text-xs font-bold text-[#4b7165] hover:underline">View Soulmate Code</Link>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#8c7c6c]">Profile visibility</label>
                <StyledSelectField
                  value={settings.profileVisibility}
                  onValueChange={(value) => setSettings((p) => ({ ...p, profileVisibility: value as SettingsState['profileVisibility'] }))}
                  options={profileVisibilityOptions}
                  ariaLabel="Profile visibility"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#8c7c6c]">Photo access</label>
                <StyledSelectField
                  value={settings.photoVisibility}
                  onValueChange={(value) => setSettings((p) => ({ ...p, photoVisibility: value as SettingsState['photoVisibility'] }))}
                  options={photoVisibilityOptions}
                  ariaLabel="Photo access"
                />
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {privacyItems.map((item) => (
                <SettingToggleRow
                  key={item.key}
                  label={item.label}
                  description={item.description}
                  checked={settings[item.key]}
                  onCheckedChange={(checked) => toggleSetting(item.key, checked)}
                  tone="sage"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Chat and Account */}
        <div className="space-y-6 lg:col-span-5">
          {/* Chat Settings */}
          <div className="glass-card group p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f0f3] text-[#45a1b8] transition-transform group-hover:rotate-6">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1f2330]">Chat Controls</h2>
                <p className="text-sm font-medium text-[#8c7c6c]">Manage your interactions</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {chatItems.map((item) => (
                <SettingToggleRow
                  key={item.key}
                  label={item.label}
                  description={item.description}
                  checked={settings[item.key]}
                  onCheckedChange={(checked) => toggleSetting(item.key, checked)}
                  tone="sky"
                />
              ))}
            </div>
          </div>

          {/* Account Security */}
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdf2f2] text-[#b84f45]">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1f2330]">Account Security</h2>
                <p className="text-sm font-medium text-[#8c7c6c]">{user?.email}</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {/* Change Password */}
              <div className="overflow-hidden rounded-3xl border border-[#8f7b67]/10 transition-all hover:border-[#b84f45]/20">
                <button 
                  onClick={togglePasswordChange}
                  className="flex w-full items-center justify-between bg-white/70 px-5 py-4 transition-colors hover:bg-white"
                >
                  <span className="flex items-center gap-3 font-bold text-[#1f2330]">
                    <Lock className="h-4 w-4 text-[#b84f45]" />
                    Change password
                  </span>
                  <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${showPasswordChange ? 'rotate-90' : ''}`} />
                </button>
                
                {showPasswordChange && (
                  <form
                    onSubmit={handlePasswordChange}
                    autoComplete="off"
                    className="bg-white/40 p-5 pt-0 animate-in slide-in-from-top-4"
                  >
                    <div className="space-y-4 mt-4">
                      <p className="text-sm leading-relaxed text-[#62584d]">
                        Confirm your current password before choosing a stronger new one.
                      </p>
                      <input
                        type="email"
                        name="accountSecurityUsername"
                        value={user?.email ?? ''}
                        autoComplete="username"
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                        className="sr-only"
                      />
                      <input 
                        type="password" 
                        name="accountSecurityCurrentSecret"
                        placeholder="Current password" 
                        className="input-surface"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                        onFocus={() => armSensitiveField('passwordCurrent')}
                        onPointerDown={() => armSensitiveField('passwordCurrent')}
                        autoComplete="off"
                        readOnly={!armedSensitiveFields.passwordCurrent}
                        data-1p-ignore="true"
                        data-lpignore="true"
                        data-bwignore="true"
                        required
                      />
                      <input 
                        type="password" 
                        name="accountSecurityNextSecret"
                        placeholder="New password" 
                        className="input-surface"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                        onFocus={() => armSensitiveField('passwordNew')}
                        onPointerDown={() => armSensitiveField('passwordNew')}
                        autoComplete="new-password"
                        readOnly={!armedSensitiveFields.passwordNew}
                        data-1p-ignore="true"
                        data-lpignore="true"
                        data-bwignore="true"
                        required
                      />
                      <input 
                        type="password" 
                        name="accountSecurityConfirmSecret"
                        placeholder="Confirm new password" 
                        className="input-surface"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                        onFocus={() => armSensitiveField('passwordConfirm')}
                        onPointerDown={() => armSensitiveField('passwordConfirm')}
                        autoComplete="new-password"
                        readOnly={!armedSensitiveFields.passwordConfirm}
                        data-1p-ignore="true"
                        data-lpignore="true"
                        data-bwignore="true"
                        required
                      />
                      <div className="rounded-[22px] border border-[#eadbcc] bg-[#fcf8f3] p-4">
                        <p className="text-sm font-semibold text-[#1f2330]">Password checklist</p>
                        <div className="mt-3 grid gap-2 text-sm text-[#62584d]">
                          {passwordChecks.map((check) => (
                            <div key={check.key} className="flex items-center gap-3">
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${
                                  check.passed ? 'bg-[#4b7165]' : 'bg-[#d8c9ba]'
                                }`}
                              />
                              <span>{check.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || passwordChecks.some((check) => !check.passed) || !passwordData.currentPassword}
                        className="btn-primary w-full py-3 shadow-md"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Change Email */}
              <div className="overflow-hidden rounded-3xl border border-[#8f7b67]/10 transition-all hover:border-[#b84f45]/20">
                <button 
                  onClick={toggleEmailChange}
                  className="flex w-full items-center justify-between bg-white/70 px-5 py-4 transition-colors hover:bg-white"
                >
                  <span className="flex items-center gap-3 font-bold text-[#1f2330]">
                    <Mail className="h-4 w-4 text-[#b84f45]" />
                    Change email address
                  </span>
                  <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${showEmailChange ? 'rotate-90' : ''}`} />
                </button>
                
                {showEmailChange && (
                  <form
                    onSubmit={handleEmailChange}
                    autoComplete="off"
                    className="bg-white/40 p-5 pt-0 animate-in slide-in-from-top-4"
                  >
                    <div className="mt-4 space-y-4">
                      <p className="text-sm leading-relaxed text-[#62584d]">
                        Update your login email. We ask for your current password first, then Supabase sends a verification link before the change becomes active.
                      </p>
                      <input
                        type="email"
                        name="accountEmailChangeUsername"
                        value={user?.email ?? ''}
                        autoComplete="username"
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                        className="sr-only"
                      />
                      <input
                        type="password"
                        name="accountEmailChangeSecret"
                        placeholder="Current password"
                        className="input-surface"
                        value={emailChangePassword}
                        onChange={(e) => setEmailChangePassword(e.target.value)}
                        onFocus={() => armSensitiveField('emailCurrent')}
                        onPointerDown={() => armSensitiveField('emailCurrent')}
                        autoComplete="off"
                        readOnly={!armedSensitiveFields.emailCurrent}
                        data-1p-ignore="true"
                        data-lpignore="true"
                        data-bwignore="true"
                        required
                      />
                      <input
                        type="email"
                        name="accountEmailChangeAddress"
                        placeholder="New email address"
                        className="input-surface"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onFocus={() => armSensitiveField('emailNew')}
                        onPointerDown={() => armSensitiveField('emailNew')}
                        autoComplete="off"
                        readOnly={!armedSensitiveFields.emailNew}
                        autoCapitalize="none"
                        inputMode="email"
                        spellCheck={false}
                        required
                      />
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="submit"
                          disabled={isLoading || !emailChangePassword || !newEmail.trim()}
                          className="btn-primary flex-1 py-3 shadow-md"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send verification'}
                        </button>
                        <button type="button" onClick={toggleEmailChange} className="btn-secondary flex-1 py-3">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Advanced Actions */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleLogout}
                  className="flex flex-1 items-center justify-center gap-3 rounded-[32px] border border-[#8f7b67]/10 bg-white/70 py-4 font-bold text-[#1f2330] transition-all hover:bg-[#fff7f2] hover:text-[#b84f45] active:scale-[0.98]"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex flex-1 items-center justify-center gap-3 rounded-[32px] border border-red-200 bg-red-50/50 py-4 font-bold text-red-600 transition-all hover:bg-red-50 hover:shadow-inner active:scale-[0.98]"
                >
                  <Trash2 className="h-4 w-4" />
                  Account deletion
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blocked Users Section */}
      <section className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2ee] text-[#b84f45]">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1f2330]">Blocked Profiles</h2>
            <p className="text-sm font-medium text-[#8c7c6c]">Manage who can't interact with you</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {blockedProfiles.length > 0 ? (
            blockedProfiles.map((profile) => (
              <div key={profile.id} className="surface-muted flex items-center justify-between gap-4 p-5 hover:bg-white/50 transition-colors">
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-bold text-[#1f2330]">{profile.name}</p>
                  <p className="truncate text-xs text-[#62584d]">{profile.profession}</p>
                </div>
                <button 
                  onClick={() => unblockUser(profile.id)} 
                  className="rounded-2xl border border-[#b84f45]/20 bg-white/50 px-5 py-2.5 text-xs font-bold text-[#b84f45] transition-all hover:bg-[#b84f45] hover:text-white"
                >
                  Unblock
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center">
              <p className="text-[#8c7c6c]">You haven't blocked any profiles yet.</p>
            </div>
          )}
        </div>
      </section>

      <div className="py-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c]/40">Soulmate Matchmaking Engine v1.1.0 • Built with Trust</p>
      </div>

      {/* Delete Account Modal Overlay */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1f2330]/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-red-50 text-red-500">
                <AlertTriangle className="h-10 w-10 animate-pulse" />
              </div>
              <h3 className="mt-6 text-2xl font-black text-[#1f2330]">Deletion Not Enabled Yet</h3>
              <p className="mt-4 leading-relaxed text-[#62584d]">
                Permanent account deletion needs secure server-side support and is not enabled in this build yet.
                To avoid a false promise, Soulmate will not claim your data is erased when it is only signing you out.
              </p>
              
              <div className="mt-10 flex w-full flex-col gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-2 rounded-[32px] bg-red-600 py-5 font-black text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Log out instead
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-[32px] py-5 font-bold text-[#1f2330] transition-colors hover:bg-[#f3e5d6]/50"
                >
                  Keep browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
