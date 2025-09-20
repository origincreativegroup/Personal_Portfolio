import React, { useState, useEffect } from 'react';
import {
  User, Settings, Key, Palette, Globe, Shield, Bell, Monitor,
  Smartphone, Download, Upload, Trash2, Save, X, Check, AlertCircle,
  Eye, EyeOff, ArrowLeft, HelpCircle, ExternalLink, Zap, Database,
  Paintbrush, Layout, Code, Camera, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  clearOpenAICredentials,
  loadOpenAICredentials,
  saveOpenAICredentials,
  type StoredOpenAICredentials,
} from '../utils/openAICredentials';

const SettingsPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showSecrets, setShowSecrets] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    website: '',
    location: '',
    avatar: ''
  });

  // API settings
  const [apiData, setApiData] = useState({
    openaiKey: ''
  });

  // Appearance settings
  const [appearanceData, setAppearanceData] = useState({
    theme: 'light',
    accentColor: '#5a3cf4',
    fontSize: 'medium',
    compactMode: false,
    animations: true
  });

  // Privacy settings
  const [privacyData, setPrivacyData] = useState({
    profileVisibility: 'public',
    showEmail: false,
    allowAnalytics: true,
    shareUsageData: false
  });

  // Notification settings
  const [notificationData, setNotificationData] = useState({
    emailNotifications: true,
    projectUpdates: true,
    securityAlerts: true,
    marketingEmails: false
  });

  useEffect(() => {
    // Load OpenAI credentials
    const savedCredentials = loadOpenAICredentials();
    if (savedCredentials) {
      setApiData(prev => ({ ...prev, openaiKey: savedCredentials.apiKey }));
    }
  }, []);

  const settingsTabs = [
    { id: 'profile', name: 'Profile', icon: User, description: 'Personal information and bio' },
    { id: 'appearance', name: 'Appearance', icon: Palette, description: 'Theme and visual preferences' },
    { id: 'api-keys', name: 'API Keys', icon: Key, description: 'External service integrations' },
    { id: 'privacy', name: 'Privacy', icon: Shield, description: 'Data and visibility settings' },
    { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Email and alert preferences' },
    { id: 'export', name: 'Data & Export', icon: Download, description: 'Backup and export options' }
  ];

  const colorOptions = [
    { color: '#5a3cf4', name: 'Purple' },
    { color: '#10b981', name: 'Green' },
    { color: '#f59e0b', name: 'Orange' },
    { color: '#ef4444', name: 'Red' },
    { color: '#8b5cf6', name: 'Violet' },
    { color: '#06b6d4', name: 'Cyan' },
    { color: '#84cc16', name: 'Lime' },
    { color: '#f97316', name: 'Amber' }
  ];

  const handleSaveApiKeys = () => {
    try {
      if (apiData.openaiKey) {
        saveOpenAICredentials({ apiKey: apiData.openaiKey });
      } else {
        clearOpenAICredentials();
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSaveSettings = (section: string) => {
    setSaveStatus('saving');
    // Simulate save operation
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors mr-3">
                <Camera size={16} className="inline mr-2" />
                Upload Photo
              </button>
              <button className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
                isDarkMode
                  ? 'border-gray-600 hover:bg-gray-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                Remove
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your full name"
                className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                    : 'border-gray-200 bg-white focus:border-purple-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                    : 'border-gray-200 bg-white focus:border-purple-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="url"
                value={profileData.website}
                onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
                className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                    : 'border-gray-200 bg-white focus:border-purple-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, Country"
                className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                    : 'border-gray-200 bg-white focus:border-purple-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                  : 'border-gray-200 bg-white focus:border-purple-500'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSaveSettings('profile')}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          Save Profile
        </button>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Theme Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">Color Theme</label>
            <div className="grid grid-cols-3 gap-4">
              {['light', 'dark', 'auto'].map((theme) => (
                <label key={theme} className="cursor-pointer">
                  <input
                    type="radio"
                    value={theme}
                    checked={appearanceData.theme === theme}
                    onChange={(e) => setAppearanceData(prev => ({ ...prev, theme: e.target.value }))}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    appearanceData.theme === theme
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                      : isDarkMode
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      {theme === 'light' && <Monitor size={20} />}
                      {theme === 'dark' && <Monitor size={20} className="text-gray-800" />}
                      {theme === 'auto' && <Smartphone size={20} />}
                      <span className="font-medium capitalize">{theme}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Accent Color</label>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map(({ color, name }) => (
                <button
                  key={color}
                  onClick={() => setAppearanceData(prev => ({ ...prev, accentColor: color }))}
                  className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 ${
                    appearanceData.accentColor === color
                      ? 'border-gray-400 dark:border-gray-300'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Font Size</label>
            <select
              value={appearanceData.fontSize}
              onChange={(e) => setAppearanceData(prev => ({ ...prev, fontSize: e.target.value }))}
              className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                  : 'border-gray-200 bg-white focus:border-purple-500'
              }`}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={appearanceData.compactMode}
                onChange={(e) => setAppearanceData(prev => ({ ...prev, compactMode: e.target.checked }))}
                className="w-5 h-5 text-purple-600 rounded"
              />
              <div>
                <div className="font-medium">Compact Mode</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Reduce spacing and padding for more content
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={appearanceData.animations}
                onChange={(e) => setAppearanceData(prev => ({ ...prev, animations: e.target.checked }))}
                className="w-5 h-5 text-purple-600 rounded"
              />
              <div>
                <div className="font-medium">Enable Animations</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Show smooth transitions and effects
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSaveSettings('appearance')}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );

  const renderApiKeysTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">API Integrations</h3>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Connect external services to enhance your portfolio features
        </p>

        <div className="space-y-6">
          {/* OpenAI Integration */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">OpenAI API</h4>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Enable AI-powered features like content analysis and generation
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <div className="flex gap-2">
                      <input
                        type={showSecrets ? 'text' : 'password'}
                        value={apiData.openaiKey}
                        onChange={(e) => setApiData(prev => ({ ...prev, openaiKey: e.target.value }))}
                        placeholder="sk-proj-..."
                        className={`flex-1 px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-700 focus:border-purple-500'
                            : 'border-gray-200 bg-white focus:border-purple-500'
                        }`}
                      />
                      <button
                        onClick={() => setShowSecrets(!showSecrets)}
                        className={`px-3 py-3 rounded-xl border transition-colors ${
                          isDarkMode
                            ? 'border-gray-700 hover:bg-gray-700'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Get your API key from{' '}
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-purple-600 underline">
                        OpenAI Platform
                      </a>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveApiKeys}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Save API Key
                    </button>
                    <button
                      onClick={() => {
                        setApiData(prev => ({ ...prev, openaiKey: '' }));
                        clearOpenAICredentials();
                      }}
                      className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
                        isDarkMode
                          ? 'border-gray-600 hover:bg-gray-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {saveStatus === 'saved' && (
                  <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2">
                    <Check size={16} />
                    <span className="text-sm">API key saved successfully</span>
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span className="text-sm">Failed to save API key</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Future integrations */}
          <div className={`p-6 rounded-xl border border-dashed opacity-60 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <div className="text-center">
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                More integrations coming soon...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Privacy & Security</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Profile Visibility</h4>
            <div className="space-y-3">
              {[
                { value: 'public', label: 'Public', description: 'Anyone can view your profile and projects' },
                { value: 'unlisted', label: 'Unlisted', description: 'Only people with the link can view' },
                { value: 'private', label: 'Private', description: 'Only you can view your content' }
              ].map((option) => (
                <label key={option.value} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    checked={privacyData.profileVisibility === option.value}
                    onChange={(e) => setPrivacyData(prev => ({ ...prev, profileVisibility: e.target.value }))}
                    className="mt-1 text-purple-600"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Data Collection</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyData.showEmail}
                  onChange={(e) => setPrivacyData(prev => ({ ...prev, showEmail: e.target.checked }))}
                  className="w-5 h-5 text-purple-600 rounded"
                />
                <div>
                  <div className="font-medium">Show Email in Profile</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Display your email address on your public profile
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyData.allowAnalytics}
                  onChange={(e) => setPrivacyData(prev => ({ ...prev, allowAnalytics: e.target.checked }))}
                  className="w-5 h-5 text-purple-600 rounded"
                />
                <div>
                  <div className="font-medium">Allow Analytics</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Help us improve by collecting anonymous usage data
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyData.shareUsageData}
                  onChange={(e) => setPrivacyData(prev => ({ ...prev, shareUsageData: e.target.checked }))}
                  className="w-5 h-5 text-purple-600 rounded"
                />
                <div>
                  <div className="font-medium">Share Usage Data</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Share anonymized usage patterns with third parties
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSaveSettings('privacy')}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          Save Privacy Settings
        </button>
      </div>
    </div>
  );

  const renderExportTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Data Management</h3>
        <div className="space-y-6">
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Download size={20} />
              Export Data
            </h4>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Download all your portfolio data in various formats
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className={`p-4 rounded-lg border text-left transition-colors ${
                isDarkMode
                  ? 'border-gray-700 hover:bg-gray-750'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <FileText size={20} className="mb-2 text-blue-500" />
                <div className="font-medium">Export as JSON</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Raw data format for backup
                </div>
              </button>

              <button className={`p-4 rounded-lg border text-left transition-colors ${
                isDarkMode
                  ? 'border-gray-700 hover:bg-gray-750'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <Globe size={20} className="mb-2 text-green-500" />
                <div className="font-medium">Export as HTML</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Static website files
                </div>
              </button>
            </div>
          </div>

          <div className={`p-6 rounded-xl border border-red-200 dark:border-red-800 ${
            isDarkMode ? 'bg-red-950' : 'bg-red-50'
          }`}>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 size={20} />
              Danger Zone
            </h4>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
              Permanently delete your account and all associated data
            </p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </Link>

              <div className="border-l border-gray-300 dark:border-gray-700 h-6"></div>

              <div>
                <h1 className="text-xl font-semibold">Settings</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage your account and preferences
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Settings Navigation */}
        <nav className={`w-80 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-r min-h-screen`}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <ul className="space-y-2">
              {settingsTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          : isDarkMode
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent size={20} />
                        <div>
                          <div className="font-medium">{tab.name}</div>
                          <div className={`text-xs ${
                            activeTab === tab.id
                              ? 'text-purple-600 dark:text-purple-400'
                              : isDarkMode
                                ? 'text-gray-400'
                                : 'text-gray-500'
                          }`}>
                            {tab.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Settings Content */}
        <main className="flex-1 p-8">
          <div className="max-w-3xl">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'appearance' && renderAppearanceTab()}
            {activeTab === 'api-keys' && renderApiKeysTab()}
            {activeTab === 'privacy' && renderPrivacyTab()}
            {activeTab === 'export' && renderExportTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;