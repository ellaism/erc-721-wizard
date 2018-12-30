module.exports = {
	compileJSON: function(className, contractSource) {
		let contractOutputSelection = {};
		contractOutputSelection[className] = [ "abi", "metadata", "evm.bytecode" ];
		return {
			"language": "Solidity",
			"sources": {
				"contract": {
					"content": contractSource
				}
			},
			"settings": {
				evmVersion: "byzantium",
				outputSelection: {
					"contract": contractOutputSelection
				}
			}
		}
	}
};


