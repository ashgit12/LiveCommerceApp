import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Video, Smartphone, Key } from 'lucide-react';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.sendOTP(phone);
      setOtpSent(true);
      // For demo mode, show the OTP in a toast
      if (response.data.demo_otp) {
        setGeneratedOtp(response.data.demo_otp);
        toast.success(`Demo OTP: ${response.data.demo_otp}`, { duration: 10000 });
      } else {
        toast.success('OTP sent to your phone');
      }
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOTP(phone, otp);
      login(response.data.seller, response.data.access_token);
      toast.success('Login successful! Welcome to SareeLive');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // Use demo credentials
      const demoPhone = '9999999999';
      await authService.sendOTP(demoPhone);
      const response = await authService.verifyOTP(demoPhone, '123456');
      login(response.data.seller, response.data.access_token);
      toast.success('Demo login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Card className="w-full max-w-md shadow-2xl bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/50">
            <Video className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold heading-font bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            SareeLive OS
          </CardTitle>
          <CardDescription className="text-base text-gray-400">
            India's First Saree Live Commerce Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-gray-300">
                  <Smartphone className="inline w-4 h-4 mr-2" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  className="text-lg bg-gray-900/50 border-gray-600 text-white placeholder-gray-500"
                  data-testid="phone-input"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full btn-hover-lift bg-gradient-to-r from-primary to-secondary border-0" 
                disabled={loading} 
                data-testid="send-otp-btn"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-400">Or</span>
                </div>
              </div>
              
              <Button 
                type="button"
                variant="outline" 
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50" 
                onClick={handleDemoLogin}
                disabled={loading}
                data-testid="demo-login-btn"
              >
                🎮 Try Demo (No Phone Required)
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-gray-300">
                  <Key className="inline w-4 h-4 mr-2" />
                  Enter OTP
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-lg text-center tracking-widest bg-gray-900/50 border-gray-600 text-white placeholder-gray-500"
                  data-testid="otp-input"
                />
                <p className="text-xs text-gray-400 mt-2">Sent to +91 {phone}</p>
                {generatedOtp && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Demo Mode: Use OTP <span className="font-mono font-bold">{generatedOtp}</span>
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full btn-hover-lift bg-gradient-to-r from-primary to-secondary border-0" 
                disabled={loading} 
                data-testid="verify-otp-btn"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setGeneratedOtp('');
                }}
                data-testid="change-number-btn"
              >
                ← Change Phone Number
              </Button>
            </form>
          )}
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>By continuing, you agree to our Terms of Service</p>
            <p className="mt-2 text-gray-600">🔒 Your data is secure with us</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
