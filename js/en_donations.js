function cryptoChange(selection) {
  var coinproperties = JSON.parse(selection.value);
  document.getElementById('crypto-qr').src = coinproperties.imageurl;
  document.getElementById('CoinDescription').innerHTML = coinproperties.description;
  document.getElementById('address').innerHTML = coinproperties.address;
}

const metamaskDiv = document.querySelector('#forMetamask');

if (typeof window.ethereum !== 'undefined') {
  console.log('MetaMask is installed!');
  /*Displaying the div*/
  metamaskDiv.style.display = "";
  var idToExplorer = {
    "0x1": function(hash){return "https://www.etherscan.io/tx/" + hash},
    "0x3": function(hash){return "https://ropsten.etherscan.io/tx/" + hash},
    "0x4": function(hash){return "https://rinkeby.etherscan.io/tx/" + hash},
    "0x5": function(hash){return "https://goerli.etherscan.io/tx/" + hash},
    "0x2a": function(hash){return "https://kovan.etherscan.io/tx/" + hash}
  }

  let accounts;
  const chainP = document.querySelector('#networkChainP')
  const statusP = document.querySelector('#connexionStatusP');
  const ethereumButton = document.querySelector('.enableEthereumButton');
  const sendEthButton = document.querySelector('.sendEthButton');
  const donation = document.querySelector('#Donation');
  let gasURL = "https://ethgasstation.info/api/ethgasAPI.json";
  let chainsURL ="https://chainid.network/chains.json";
  /*Giving a default gas value in case the json doesn't parse.
   It is customizable in Metamask.*/
  var gasEsti = 75*10**9;
  var chains;

  var i = 0;
  getGasEstimation();
  getChains();
  getAccount();
  getNet();

  ethereumButton.addEventListener('click', () => {
    getAccount();
  });

  function checkNetwork() {
    currentChainId = parseInt(ethereum.chainId, 16);
    if (currentChainId != 1) {
      try {
        for (var i=0; i<chains.length; i++) {
          if (currentChainId == chains[i].chainId) {
	    chainP.innerHTML = 'You are using ' + chains[i].name + '. Please change to Ethereum Mainnet';
	  }
	}
      } catch {
	chainP.innerHTML = 'Make sure you are using the Ethereum Mainnet';
	}
    } else {
	chainP.innerHTML = 'You are using the Ethereum Mainnet';
    }
  }

  ethereum.on('chainChanged', (chainId) => {
  // Handle the new chain.
  // Correctly handling chain changes can be complicated.
  // We recommend reloading the page unless you have good reason not to.
    window.location.reload();
    i++;
  });

  ethereum.on('accountsChanged', function () {
    window.location.reload();
    i++
  });

	//Sending Ethereum to an address
	sendEthButton.addEventListener('click', () => {
		getAccount();
		makeDonation()
	});

	function gasToHex(gasPrice) {
		return '0x'+ gasPrice.toString(16);
	}

	function getGasEstimation() {
		fetch(gasURL)
			.then(data => data.json())
			.then((out) => {
				gasEsti = out.fast*10**8;
			})
			.catch(err => { throw err});
	}

	function getChains() {
		fetch(chainsURL)
		  .then(data => data.json())
			.then((out) => {
				chains = out;
				checkNetwork();
			})
			.catch(err => { throw err});
	}

	function makeDonation() {
		var gasString = gasToHex(gasEsti);
		ethereum.request({method: 'eth_sendTransaction',
											params: [
												{
													from: accounts[0],
													to: '0xA8f089E2f29822b9B3726Dc7AD38a4C942418083',
													value: '0x11c37937e08000',
													gasPrice: gasString,
													gas: '0x5208',
													chainId: '0x3'
												},
											],
										})
			.then((txHash) => console.log(donation.innerHTML = '<h2>Thank you !!</h2> <p> Here is your transaction hash : '+ txHash + getExplorerLink(ethereum.chainId, txHash)))

			.catch((error) => console.error);
		}

  function getNet() {
		var i = 0;
		if (ethereum.chainId === null) {
			setTimeout(function(){getNet();}, 50);
			i+=1
		} else {
			checkNetwork();
		}
	}

	function getExplorerLink(chainId, txHash) {
		fullstring = '';
		url = idToExplorer[chainId](txHash);
		if (url) {
			fullstring += '<br>You can see your transaction <a rel="external" href="'+ url +'"; target=_blank">here</a></p>'
		}
		return fullstring

	}


	async function getAccount() {
		accounts = await ethereum.request({method: 'eth_requestAccounts'})
		sendEthButton.disabled = false;
		sendEthButton.style.cursor = "";
		statusP.innerHTML = "You are connected with this account : " + accounts[0];
		ethereumButton.style.display = "none";
		sendEthButton.style.opacity = 1;
  }
}
