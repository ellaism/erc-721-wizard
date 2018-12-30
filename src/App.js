import React, {Component} from 'react';
import './App.css';
import hljs from 'highlight.js/lib/highlight';
import solidity from 'highlightjs-solidity/solidity';
import 'highlight.js/styles/github.css'
import mustache from 'mustache';
import * as contractTemplate from './templates/erc721';
import * as compileJSON from './templates/compile';
import camelCase from 'camel-case';
import capitalize from 'capitalize-first-letter';
import CompilerVersion from './components/CompilerVersion';
import {library} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCog} from '@fortawesome/free-solid-svg-icons'
import * as wrapper from 'solc/wrapper'

const solcjs = require('solc-js');
library.add(faCog);

let request = require('sync-request');
let Web3 = require('web3');

hljs.configure({languages: ['solidity']});
solidity(hljs);

class App extends Component {
	constructor(props) {
		super(props);
		mustache.parse(contractTemplate);
		this.handleTokenPropertyChanged = this.handleTokenPropertyChanged.bind(this);
		this.handleDeployContract = this.handleDeployContract.bind(this);
		this.handleChangeCompilerVersion = this.handleChangeCompilerVersion.bind(this);
		this.handleCompilerLoaderChanged = this.handleCompilerLoaderChanged.bind(this);
		this.updateContract = this.updateContract.bind(this);
		this.compileContract = this.compileContract.bind(this);
		this.compileAndDeploy = this.compileAndDeploy.bind(this);
		this.compileAndEstimate = this.compileAndEstimate.bind(this);
		this.findImports = this.findImports.bind(this);
		this.setupWeb3 = this.setupWeb3.bind(this);
		this.deploy = this.deploy.bind(this);
		this.handleMinterRoleChanged = this.handleMinterRoleChanged.bind(this);
		this.handleEstimateGas = this.handleEstimateGas.bind(this);
		this.handleGasLimitChanged = this.handleGasLimitChanged.bind(this);
		this.codeRef = React.createRef();
		this.changedTokenSymbol = false;
		this.state = {generatedContract: '', gasLimit: '', gasPrice: 2, working: false, minterRole: true, web3ready: false, statusMessage: '', userTokenName: '', userTokenSymbol: '', tokenName: 'My Token', tokenSymbol: 'MT', preferredCompilerVersion: 'v0.4.24-stable-2018.05.16', compilerVersion: '', compilerLoader: null, compilerErrors: null};
	}

	componentDidMount() {
		this.setupWeb3();
	}

	setupWeb3() {
		let self = this;
		this.setState({working: true, statusMessage: 'Checking for Web3 support in your browser. You might need to check MetaMask to see if it\'s asking for permissions.', web3ready: false}, function () {
			self.initWeb3().then((result) => {
				window.web3.eth.net.getId().then((id) => {

					let currentNetwork = "an unknown network (ID: " + id + ").";
					if (id === 64)
					{
						currentNetwork = <span>the Ellaism <strong>MainNet.</strong></span>;
					} else if (id === 16448) {
						currentNetwork = <span>the Ellaism <strong>TestNet (Shikinseki).</strong></span>;
					}
				let msg = <div>Your browser is ready. You may now create your token on {currentNetwork} {result === "legacy" && <span>Consider <a href="https://metamask.io/">upgrading MetaMask</a>.</span>}</div>
				self.setState({statusMessage: msg, web3ready: true, working: false});
				})
			}).catch((result) => {
				let msg = null;
				if (result === "user_denied") {
					msg = <span>Your browser does not have access to your wallet. You need to <a href="#grant-permissions" onClick={this.setupWeb3}>grant permissions</a> before deploying your token.</span>
				} else if (result === "missing_web3") {
					msg = <span>Your browser does not support Web3. You need to <a href="https://metamask.io/">install MetaMask</a> before deploying your token.</span>
				}
				self.setState({working: false, statusMessage: msg});
			});
		});
	}

	handleChangeCompilerVersion(version, selectedRelease) {
		this.compiler = null;
		this.updateContract({compilerVersion: version, selectedRelease: selectedRelease});
	}

	handleCompilerLoaderChanged(compilerLoader) {
		this.setState({compilerLoader: compilerLoader})
	}

	updateContract(newState) {
		let up = {...this.state, ...newState};
		const tokenName = (up.tokenName == '') ? 'My Token' : up.tokenName;
		if (!this.changedTokenSymbol) {
			up.tokenSymbol = this.generateSymbol(tokenName).toUpperCase();
		}
		up.generatedContract = this.generateContract(this.generateClassName(tokenName), tokenName, up.tokenSymbol, up.compilerVersion, up.minterRole);
		this.setState(up);
	}

	handleTokenPropertyChanged(e) {
		let up = {};

		if (e.target.id === "tokenName") {
			up[e.target.id] = e.target.value;
		} else if (e.target.id === "tokenSymbol") {
			up[e.target.id] = e.target.value.toUpperCase();
			this.changedTokenSymbol = (e.target.value != "");
		}
		this.updateContract(up);
	}

	generateSymbol(tokenName) {
		let matches = tokenName.match(/\b(\w)/g);
		let acronym = '';
		if (matches !== null && matches.length > 0) {
			acronym = matches.join('');
			if (acronym.length < 2) {
				acronym = tokenName.substr(0, 3).trim();
			}
		}
		return acronym;
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (prevState.generatedContract !== this.state.generatedContract) {
			hljs.highlightBlock(this.codeRef.current);
		}
	}

	generateClassName(token_name) {
		return capitalize(camelCase(token_name == "" ? 'My Token' : token_name));
	}

	generateContract(class_name, token_name, token_symbol, compiler_version, minter_role) {
		return mustache.render(contractTemplate, {minter_role: minter_role, class_name: class_name, token_name: token_name, token_symbol: token_symbol, compiler_version: compiler_version});
	}

	findImports(path) {
		try {
			let res = request('GET', 'https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-solidity/master/contracts/' + path);
			let p = {contents: res.getBody()};
			return p;
		} catch (e) {
			return {'error': 'https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-solidity/master/contracts/' + path}
		}
	}

	initWeb3() {
		this.eth = null;
		return new Promise(async (resolve, reject) => {
			if (window.ethereum) {
				window.web3 = new Web3(window.ethereum);
				try {
					await window.ethereum.enable();
					this.eth = window.web3;
					resolve('ready');
				} catch (error) {
					reject('user_denied');
					// User denied account access...
				}
			}
			// Legacy dapp browsers...
			else if (window.web3) {
				window.web3 = new Web3(window.web3.currentProvider);
				resolve('legacy');
			}
			// Non-dapp browsers...
			else {
				reject('missing_web3');
			}
		});
	}

	loadCompiler() {
		return new Promise((resolve, reject) => {
			const useVersion = (error, url) => {
				if (error) {
					console.error(error);
					reject(error);
				}
				console.log('url:', url);

				solcjs.loadCompiler(url, (compiler) => {
					resolve(wrapper(compiler));
				});
			};

			this.state.compilerLoader(this.state.selectedRelease, useVersion)
		});
	}

	compileContract() {
		return new Promise(async (resolve, reject) => {
			let className = this.generateClassName(this.state.tokenName);
			let co = compileJSON.compileJSON(className, this.state.generatedContract);
			let result = await this.compiler.compile(JSON.stringify(co), this.findImports);
			let output = JSON.parse(result);
			if ((output.errors != null) && (output.errors.length > 0)) {
				this.setState({compilerErrors: output.errors});
				return reject(output);
			}
			resolve(output)
		});
	}

	estimate(compiled, from) {
		let className = this.generateClassName(this.state.tokenName);
		let bytecode = compiled.contracts.contract[className].evm.bytecode.object;
		let abi = compiled.contracts.contract[className].abi;
		this.setState({statusMessage: 'Estimating gas limit', working: true});

		return new Promise((resolve, reject) => {
			let contract = new window.web3.eth.Contract(abi, {from: from});
			contract.deploy({
				data: '0x' + bytecode,
				from: from
			}).estimateGas(function (err, gas) {
				resolve(gas);
			});
		});
	}

	deploy(compiled, from, gasLimit, gasPrice) {
		this.setState({statusMessage: 'Deploying', working: true});
		let self = this;
		let className = this.generateClassName(this.state.tokenName);
		let bytecode = compiled.contracts.contract[className].evm.bytecode.object;
		let abi = compiled.contracts.contract[className].abi;
		let contract = new window.web3.eth.Contract(abi, {from: from, gasLimit: gasLimit});
		contract.deploy({
			data: '0x' + bytecode,
			from: from,
			gas: gasLimit
		}).send({
			from: from,
			gas: gasLimit,
			gasPrice: gasPrice
		}, function(error, transactionHash){
			if (error)
			{
				self.setState({statusMessage: error.message, working: false});
			} else {
				self.setState({transactionHash: transactionHash, statusMessage: 'Waiting for contract to deploy, tx : ' + transactionHash, working: true});
			}
		}).then(function(newContractInstance) {
			let address = newContractInstance.options.address;
			console.log(address);
			self.setState({deployedAddress: address, statusMessage: 'Done! Contract address is ' + address, working: false});
		});
	}

	compileAndDeploy() {
		this.setState({statusMessage: 'Compiling', working: true}, function () {
			window.web3.eth.getAccounts().then((accounts) => {
				this.compileContract().then((compiled) => {
					if (!this.state.gasLimit) {
						this.estimate(compiled, accounts[0]).then((gas) => {
							this.deploy(compiled, accounts[0], gas, this.state.gasPrice);
						});
					} else {
						this.deploy(compiled, accounts[0], this.state.gasLimit, this.state.gasPrice);
					}
				});
			});
		});
	}

	compileAndEstimate() {
		this.setState({statusMessage: 'Compiling', working: true}, function () {
			window.web3.eth.getAccounts().then((accounts) => {
				this.compileContract().then((compiled) => {
					this.estimate(compiled, accounts[0]).then((gas) => {
						this.setState({gasLimit: gas, working: false, statusMessage: 'Done! Gas limit estimate is ' + gas});
					});
				});
			});
		});
	}

	handleDeployContract() {
		if (!this.compiler) {
			this.setState({statusMessage: 'Loading compiler', working: true}, function () {
				this.loadCompiler().then((compiler) => {
					this.compiler = compiler;
					this.compileAndDeploy();
				});
			});
		} else {
			this.compileAndDeploy();
		}
	}

	handleEstimateGas()
	{
		if (!this.compiler) {
			this.setState({statusMessage: 'Loading compiler', working: true}, function () {
				this.loadCompiler().then((compiler) => {
					this.compiler = compiler;
					this.compileAndEstimate();
				});
			});
		} else {
			this.compileAndEstimate();
		}
	}

	handleGasLimitChanged(e)
	{
		this.setState({gasLimit: e.target.value});
	}

	handleMinterRoleChanged(e)
	{
		this.updateContract({minterRole: e.target.checked});
	}

	render() {
		return (
			<div className="App">
				<div className="container">
					<h1>Ellaism Collectible Token Wizard</h1>
					<div className={"description"}>
						<p>Creating a token is the first step in turning your digital creations into certified collectibles that can be sold or traded. A token proves to the holder that the origin of the digital item is authentic.</p>
						<p>If you wanted to create trading cards for famous crypto personalities, you would only use this wizard one time. A different tool would be used to create the individual trading cards.</p>
					</div>
					<form>
						<div className={"token-form"}>
							<div className="form-group">
								<label htmlFor="tokenName">Choose a name for your token</label>
								<input type="text" placeholder={this.state.tokenName} onChange={this.handleTokenPropertyChanged} className="form-control" id="tokenName" aria-describedby="tokenHelp"/>
								<small id="tokenHelp" className="form-text text-muted">The name will appear in wallets and exchanges. You may <strong>not</strong> change this later so <strong>make sure you are happy with what you enter!</strong></small>
							</div>

							<div className="form-group">
								<label htmlFor="tokenSymbol">Choose a symbol</label>
								<input type="text" placeholder={this.state.tokenSymbol} onChange={this.handleTokenPropertyChanged} className="form-control" id="tokenSymbol" aria-describedby="tokenSymbol"/>
								<small id="tokenSymbol" className="form-text text-muted">The symbol of the token, as it might appear on exchanges. You may <strong>not</strong> change this later so <strong>make sure you like the symbol!</strong></small>
							</div>

							<div className="form-group deploy-button">
								<div className={"row"}>
									<div className={"col"}>
										<button disabled={!this.state.web3ready} onClick={this.handleDeployContract} type="button" className="btn btn-primary">Create Token</button>
									</div>
								</div>
								<div className={"row"}>
									<div className={"col"}>
										<div className={"show-source"}>
											<a data-toggle="collapse" data-target="#source-code" aria-expanded="false" aria-controls="source-code">
												<FontAwesomeIcon icon="cog"/>&nbsp;Show contract source code (Advanced Options)
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>

						{this.state.compilerErrors &&
						<div className={"compiler-errors"}>
							{this.state.compilerErrors.map((e, index) => {
								return <div key={index}>{e.formattedMessage}</div>
							})}
						</div>
						}

						<div className="collapse" id="source-code">
							<CompilerVersion preferredCompilerVersion={this.state.preferredCompilerVersion} onCompilerLoaderChanged={this.handleCompilerLoaderChanged} onCompilerVersionChange={this.handleChangeCompilerVersion}/>
							<div className="form-group">
								<label htmlFor="gasLimit">Gas limit</label>
								<input type="text" value={this.state.gasLimit} onChange={this.handleGasLimitChanged} className="form-control" id="gasLimit" aria-describedby="gasLimit"/>
								<small id="gasLimitDesc" className="form-text text-muted">Maximum amount of gas to use when deploying. <a onClick={this.handleEstimateGas} href="#estimate">Estimate gas now</a> or leave this blank to perform estimate before deploying.</small>
							</div>
							<div className="form-group form-check">
								<input onChange={this.handleMinterRoleChanged} type="checkbox"  checked={this.state.minterRole} className="form-check-input" id="minter-role"/>
									<label className="form-check-label" htmlFor="minter-role">Enable Minter Role</label>
							</div>
							<code id="generatedContract" ref={this.codeRef}>
								{this.state.generatedContract}
							</code>
							<small>This token source code is based on the <a href="https://github.com/OpenZeppelin/openzeppelin-solidity">OpenZeppelin ERC-721 contract</a>.</small>
						</div>

					</form>
				</div>

				<footer className="footer mt-auto py-3">
					<div className="container">
						<div className="row">
							<div className={"web3-status"}>
								{this.state.working && <img src={"/images/ellaemb.gif"}/>}{this.state.statusMessage}
							</div>
						</div>
					</div>
				</footer>
			</div>
		);
	}
}

export default App;
