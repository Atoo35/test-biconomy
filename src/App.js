import './App.css';
import logo from './logo.svg';
import { useCallback, useEffect, useState } from 'react';
import SocialLogin from "@biconomy/web3-auth";
import { ethers } from 'ethers';

function App () {
  const [socialLoginSdk, setSocialLoginSdk] = useState(null);
  const [address, setAddress] = useState(null);

  const connectWallet = useCallback(async () => {
    if (address) return;
    if (socialLoginSdk?.provider) {
      // await socialLoginSdk.showWallet()
      console.info('socialLoginSdk provider', socialLoginSdk)
      const web3Provider = new ethers.providers.Web3Provider(
        socialLoginSdk.web3auth.provider,
      );
      console.info('web3Provider', web3Provider)
      const signer = web3Provider.getSigner();
      const gotAccount = await signer.getAddress();
      setAddress(gotAccount);
      const network = await web3Provider.getNetwork();
      console.table({ signer, gotAccount, network });
      console.info('userInfo', await socialLoginSdk.getUserInfo())
      // socialLoginSdk.hideWallet()
      return
    }
    if (socialLoginSdk) {
      socialLoginSdk.showWallet()
      return;
    }
    const socialLogin = new SocialLogin();
    const signature = await socialLogin.whitelistUrl('http://localhost:3000');
    console.log('signature', signature)
    await socialLogin.init(ethers.utils.hexValue(80001), {
      'http://localhost:3001': signature
    });    // Enter the network id in init() parameter
    socialLogin.showConnectModal();
    setSocialLoginSdk(socialLogin);
    socialLogin.showWallet()
  }, [address, socialLoginSdk])

  const disconnect = async () => {
    if (socialLoginSdk) {
      // socialLoginSdk.hideWallet()
      console.log('wtf', socialLoginSdk)
      setSocialLoginSdk(null)
      setAddress(null);
      socialLoginSdk.logout()
    }
  }

  useEffect(() => {
    if (socialLoginSdk && address) {
      console.log("hidewallet");
      socialLoginSdk.hideWallet();
    }
  }, [address, socialLoginSdk]);

  useEffect(() => {
    const initSocialLogin = async () => {
      if (!socialLoginSdk) {

        const socialLogin = new SocialLogin();
        const signature = await socialLogin.whitelistUrl('http://localhost:3000');
        console.log('signature', signature)
        await socialLogin.init(ethers.utils.hexValue(80001), {
          'http://localhost:3001': signature
        });    // Enter the network id in init() parameter
        socialLogin.showConnectModal();
        setSocialLoginSdk(socialLogin);
      }
    }
    if (!socialLoginSdk) initSocialLogin()
  }, [socialLoginSdk]);

  useEffect(() => {
    (async () => {
      if (socialLoginSdk?.provider && !address) {
        connectWallet();
      }
    })();
  }, [address, connectWallet, socialLoginSdk, socialLoginSdk?.provider]);


  useEffect(() => {
    const interval = setInterval(async () => {
      if (address) {
        clearInterval(interval);
      }
      if (socialLoginSdk?.provider && !address) {
        connectWallet();
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [address, connectWallet, socialLoginSdk]);

  return (
    <div className="App">
      <header className="App-header">
        {socialLoginSdk && address ? <button onClick={disconnect}>Disconnect</button> : <button onClick={connectWallet}>Connect Wallet</button>}


        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
