import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Facebook, Youtube, Instagram, Key, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const [streamKeys, setStreamKeys] = useState({
    facebook: {
      streamKey: '',
      pageId: '',
      accessToken: ''
    },
    youtube: {
      streamKey: '',
      streamUrl: 'rtmp://a.rtmp.youtube.com/live2',
      channelId: ''
    },
    instagram: {
      streamKey: '',
      streamUrl: '',
      username: ''
    }
  });

  const [whatsapp, setWhatsapp] = useState({
    gupshupApiKey: '',
    appName: '',
    phoneNumber: ''
  });

  const [payments, setPayments] = useState({
    razorpayKeyId: '',
    razorpayKeySecret: '',
    cashfreeClientId: '',
    cashfreeClientSecret: ''
  });

  const saveSettings = (section) => {
    // In production, this would save to backend
    toast.success(`${section} settings saved!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold heading-font text-primary">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Configure your platform connections and integrations</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="streaming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="streaming">Streaming Platforms</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Streaming Platforms */}
          <TabsContent value="streaming" className="space-y-6">
            {/* Connect Accounts Banner */}
            <Card className="bg-gradient-to-r from-primary to-secondary border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Connect Your Social Accounts</h3>
                    <p className="text-sm opacity-90">Link Facebook, YouTube, and Instagram for seamless live streaming</p>
                  </div>
                  <Button 
                    size="lg" 
                    variant="secondary"
                    onClick={() => window.location.href = '/connect-accounts'}
                    data-testid="connect-accounts-btn"
                  >
                    Connect Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Facebook */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Facebook className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Facebook Live</CardTitle>
                    <CardDescription>Configure Facebook Page live streaming</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Page ID</label>
                  <Input
                    placeholder="Your Facebook Page ID"
                    value={streamKeys.facebook.pageId}
                    onChange={(e) => setStreamKeys({
                      ...streamKeys,
                      facebook: { ...streamKeys.facebook, pageId: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Stream Key</label>
                  <Input
                    type="password"
                    placeholder="Your Facebook stream key"
                    value={streamKeys.facebook.streamKey}
                    onChange={(e) => setStreamKeys({
                      ...streamKeys,
                      facebook: { ...streamKeys.facebook, streamKey: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Access Token</label>
                  <Input
                    type="password"
                    placeholder="Facebook Page Access Token"
                    value={streamKeys.facebook.accessToken}
                    onChange={(e) => setStreamKeys({
                      ...streamKeys,
                      facebook: { ...streamKeys.facebook, accessToken: e.target.value }
                    })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveSettings('Facebook')} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => window.open('https://developers.facebook.com/docs/live-video-api/', '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Get Keys
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* YouTube */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Youtube className="h-6 w-6 text-red-600" />
                  <div>
                    <CardTitle>YouTube Live</CardTitle>
                    <CardDescription>Configure YouTube channel streaming</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Channel ID</label>
                  <Input
                    placeholder="Your YouTube Channel ID"
                    value={streamKeys.youtube.channelId}
                    onChange={(e) => setStreamKeys({
                      ...streamKeys,
                      youtube: { ...streamKeys.youtube, channelId: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Stream URL</label>
                  <Input
                    placeholder="rtmp://a.rtmp.youtube.com/live2"
                    value={streamKeys.youtube.streamUrl}
                    onChange={(e) => setStreamKeys({
                      ...streamKeys,
                      youtube: { ...streamKeys.youtube, streamUrl: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Stream Key</label>
                  <Input
                    type="password"
                    placeholder="Your YouTube stream key"
                    value={streamKeys.youtube.streamKey}
                    onChange={(e) => setStreamKeys({
                      ...streamKeys,
                      youtube: { ...streamKeys.youtube, streamKey: e.target.value }
                    })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveSettings('YouTube')} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => window.open('https://studio.youtube.com/channel/UC/livestreaming', '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Get Keys
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Instagram */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Instagram className="h-6 w-6 text-pink-600" />
                  <div>
                    <CardTitle>Instagram Live</CardTitle>
                    <CardDescription>Configure Instagram live streaming</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Username</label>
                  <Input
                    placeholder="Your Instagram username"
                    value={streamKeys.instagram.username}
                    onChange={(e) => setStreamKeys({
                      ...streamKeys,
                      instagram: { ...streamKeys.instagram, username: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Stream URL</label>
                  <Input
                    placeholder="Instagram RTMP URL"
                    value={streamKeys.instagram.streamUrl}
                    onChange={(e) => setStreamKeys({
                      ...streamKeys,
                      instagram: { ...streamKeys.instagram, streamUrl: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Stream Key</label>
                  <Input
                    type="password"
                    placeholder="Your Instagram stream key"
                    value={streamKeys.instagram.streamKey}
                    onChange={(e) => setStreamKeys({
                      ...streamKeys,
                      instagram: { ...streamKeys.instagram, streamKey: e.target.value }
                    })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveSettings('Instagram')} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => window.open('https://www.facebook.com/business/help/instagram-live', '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle>Gupshup WhatsApp Configuration</CardTitle>
                <CardDescription>Setup WhatsApp Business API for order automation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Gupshup API Key</label>
                  <Input
                    type="password"
                    placeholder="Your Gupshup API Key"
                    value={whatsapp.gupshupApiKey}
                    onChange={(e) => setWhatsapp({ ...whatsapp, gupshupApiKey: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">App Name</label>
                  <Input
                    placeholder="Your Gupshup App Name"
                    value={whatsapp.appName}
                    onChange={(e) => setWhatsapp({ ...whatsapp, appName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">WhatsApp Business Number</label>
                  <Input
                    placeholder="+91XXXXXXXXXX"
                    value={whatsapp.phoneNumber}
                    onChange={(e) => setWhatsapp({ ...whatsapp, phoneNumber: e.target.value })}
                  />
                </div>
                <Button onClick={() => saveSettings('WhatsApp')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save WhatsApp Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Razorpay Configuration</CardTitle>
                <CardDescription>Setup Razorpay for UPI and online payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Key ID</label>
                  <Input
                    placeholder="rzp_test_XXXXXXXXXXXX"
                    value={payments.razorpayKeyId}
                    onChange={(e) => setPayments({ ...payments, razorpayKeyId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Key Secret</label>
                  <Input
                    type="password"
                    placeholder="Your Razorpay Key Secret"
                    value={payments.razorpayKeySecret}
                    onChange={(e) => setPayments({ ...payments, razorpayKeySecret: e.target.value })}
                  />
                </div>
                <Button onClick={() => saveSettings('Razorpay')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Razorpay
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cashfree Configuration</CardTitle>
                <CardDescription>Setup Cashfree as alternative payment gateway</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Client ID</label>
                  <Input
                    placeholder="Your Cashfree Client ID"
                    value={payments.cashfreeClientId}
                    onChange={(e) => setPayments({ ...payments, cashfreeClientId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Client Secret</label>
                  <Input
                    type="password"
                    placeholder="Your Cashfree Client Secret"
                    value={payments.cashfreeClientSecret}
                    onChange={(e) => setPayments({ ...payments, cashfreeClientSecret: e.target.value })}
                  />
                </div>
                <Button onClick={() => saveSettings('Cashfree')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Cashfree
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SettingsPage;
