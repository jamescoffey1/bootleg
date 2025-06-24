import React, { useState, useEffect } from "react";
import "./App.css";

export default function TopUp({ updateBalance }) {
  const [user, setUser] = useState({ username: "", email: "", btcAddress: "" });
  const [txId, setTxId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [balance, setBalance] = useState(0);
  const [usdBalance, setUsdBalance] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("bootlegger_user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setBalance(userData.balance || 0);
      setUsdBalance(userData.usdBalance || 0);
    }
  }, []);

  const verifyPayment = async () => {
    if (!txId.trim()) {
      setVerificationResult({ success: false, message: "Please enter a transaction ID" });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch('http://localhost:5000/users/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txId: txId.trim(),
          userId: user._id || user.id,
          expectedAddress: user.btcAddress
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setVerificationResult({ 
          success: true, 
          message: `Payment verified! $${result.usdAmount.toFixed(2)} added to your balance.`,
          amount: result.amount
        });
        setBalance(result.newBalance);
        setUsdBalance(result.newUsdBalance);
        
        // Update local storage with new balance
        const updatedUser = { ...user, balance: result.newBalance, usdBalance: result.newUsdBalance };
        localStorage.setItem("bootlegger_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Update the navbar balance
        if (updateBalance) {
          updateBalance(result.newBalance, result.newUsdBalance);
        }
        
        // Clear the transaction ID field
        setTxId("");
      } else {
        setVerificationResult({ success: false, message: result.message });
      }
    } catch (error) {
      setVerificationResult({ 
        success: false, 
        message: "Error verifying payment. Please try again." 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="main-content topup-page">
      <h1 className="topup-welcome">Welcome, {user.username}</h1>
      <div className="topup-grid">
        <div className="topup-left">
          <div className="topup-card telegram-card">
            <div className="telegram-icon">📩</div>
            <div className="telegram-text">Send us a message on Telegram</div>
          </div>
          <div className="topup-card profile-card">
            <div className="profile-title">Profile Info.</div>
            <div>Username: {user.username}</div>
            <div>Email: {user.email}</div>
            <div>Current Balance: ${usdBalance.toFixed(2)}</div>
            <button className="change-password-btn">Change Password</button>
          </div>
        </div>
        <div className="topup-card topup-right">
          <h2 className="topup-title">Top-Up Balance</h2>
          <div className="topup-desc">
            This is your bitcoin deposit address, send only bitcoin to this address. Sending any other token will result in loss of assets.
          </div>
          <div className="btc-label">🪙 Bitcoin Deposit Address</div>
          <div className="btc-address">{user.btcAddress || "No address generated yet."}</div>
          <div className="topup-warning">
            *Payments can take hours to confirm, do not panic when such happens, if after 24 hours of payment there is no reflection, contact support.
          </div>
          <button 
            className="copy-address-btn" 
            onClick={() => navigator.clipboard.writeText(user.btcAddress)}
          >
            Copy Address
          </button>
          
          {/* Payment Verification Section */}
          <div className="verification-section">
            <h3 className="verification-title">Verify Payment</h3>
            <div className="verification-desc">
              After sending Bitcoin to your address, paste the transaction ID below to verify and credit your account.
            </div>
            
            <div className="tx-input-group">
              <input
                type="text"
                placeholder="Enter Transaction ID (TxID)"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                className="tx-input"
                disabled={isVerifying}
              />
              <button
                onClick={verifyPayment}
                disabled={isVerifying || !txId.trim()}
                className="verify-btn"
              >
                {isVerifying ? "Verifying..." : "Verify Payment"}
              </button>
            </div>
            
            {verificationResult && (
              <div className={`verification-result ${verificationResult.success ? 'success' : 'error'}`}>
                {verificationResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 