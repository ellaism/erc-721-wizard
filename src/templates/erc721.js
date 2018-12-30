module.exports = `pragma solidity ^{{compiler_version}};

import "token/ERC721/ERC721Full.sol";{{#minter_role}}
import "access/roles/MinterRole.sol";{{/minter_role}}

/**
 * @title Full ERC721 Token
 * This implementation includes all the required and some optional functionality of the ERC721 standard
 * Moreover, it includes approve all functionality using operator terminology
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract {{class_name}} is ERC721Full{{#minter_role}}, MinterRole{{/minter_role}} {
    constructor () public ERC721Full("{{token_name}}", "{{token_symbol}}") {}
}
`;
