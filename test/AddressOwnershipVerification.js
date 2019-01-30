const {
  shouldFail,
  expectEvent,
} = require('openzeppelin-test-helpers');
const AddressOwnershipVerification = artifacts.require('AddressOwnershipVerification.sol');

contract('AddressOwnershipVerification', function (accounts) {
  const creator = accounts[0];
  const transactor = accounts[1];
  const transactee = accounts[2];
  const stranger = accounts[3];

  const otpCode = 'SampleOTP';

  let ownershipVerificationContract;

  beforeEach(async () => {
    ownershipVerificationContract = await AddressOwnershipVerification.new();
    await ownershipVerificationContract.addTransactor(transactor, {
      from: creator,
    });
  });

  describe('Limited access privilege.', function () {
    it('Transactor unable to verify for themself.', async function () {
      await shouldFail.reverting(ownershipVerificationContract.request(transactor, otpCode, {
        from: transactor,
      }));
    });

    it('Only transactor can request for new validation.', async function () {
      await shouldFail.reverting(ownershipVerificationContract.request(transactee, otpCode, {
        from: stranger,
      }));
    });
  });

  describe('Process a ownership verification.', function () {
    it('Transactor able to make new verification request.', async function () {
      const { logs } = await ownershipVerificationContract.request(transactee, otpCode, {
        from: transactor,
      });
      expectEvent.inLogs(logs, 'NewOwnershipVerification');
    });

    it('Only transactee can validate themself', async function () {
      await ownershipVerificationContract.request(transactee, otpCode, {
        from: transactor,
      });
      await shouldFail.reverting(ownershipVerificationContract.validateYourself(transactee, otpCode, {
        from: stranger,
      }));
    });

    it('Completed an ownership verification.', async function () {
      await ownershipVerificationContract.request(transactee, otpCode, {
        from: transactor,
      });
      await ownershipVerificationContract.validateYourself(transactor, otpCode, {
        from: transactee,
      });
      (await ownershipVerificationContract.isRightAddressOwnership(transactee, {
        from: transactor,
      })).should.be.equal(true);
    });
  });

});