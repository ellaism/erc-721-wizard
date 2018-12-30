# ERC-721 Token Wizard

Create and deploy collectible tokens from your browser.

## Demo Site

Try it out,

https://erc721.outdoordevs.com


## About

This wizard attempts to simplify the process of creating an ERC-721 token.  All you need to do is enter your token name and symbol and then click Create Token.

Behind the scenes the app is doing the following:

- Requesting Web3 permissions from your browser
- Connecting to Web3 current provider to check your current wallet address
- Loads a list of available Solidity compilers
- Loads the the Solidity compiler that you specify into the browser
- Uses a template to build your custom token source using OpenZeppelin ERC-721
- Resolves dependencies directly from the OpenZeppelin repo at compile time
- Estimates gas needed to deploy
- Deploys the compiled contract using Web3 provider
- Displays the resulting contract address to the user once it is mined
- Allows contract to have MinterRole disabled and custom gas limit and gas price can be changed


Once you have a contract address you can start minting your own tokens (requires a different app).


## Building

`npm install` to grab all the dependencies.

Starting a web server

`yarn start`

Doing a production build

`yarn build`


Very sorry that everything is crammed into a single component.  I wanted to get this out with minimal effort.  It will be easy to clean up someday, but I only want to spend that time if people actually use this :)




