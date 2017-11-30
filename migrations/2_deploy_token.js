var ValidToken = artifacts.require('ValidToken');

module.exports = function(deployer) {
  deployer.deploy(ValidToken);
};
