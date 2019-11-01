const db = require('@splinterlands/pg-querybuilder');
const steem_interface = require('steem-interface');

let _config = {};

function init(config) {
	_config = config;
	db.init(config);
	steem_interface.init(config);
}

function purchase(id, amount) {
	return new Promise(async (resolve, reject) => {
		let purchase = await db.lookupSingle('purchases', { uid: id });

		if(!purchase) {
			reject({ code: 'purchase_not_found', message: `Purchase [${id}] not found.` });
			return;
		}

		// Make sure the payment amount is enough!
		if(amount < parseFloat(purchase.ext_currency_amount)) {
			reject({ code: 'insufficient_amount', message: `Payment was less than the required amount of: ${purchase.ext_currency_amount}.` });
			return;
		}

		if(purchase.status > 0) {
			reject({ code: 'purchase_already_completed', message: 'The specified purchase has already been completed.' });
			return;
		}

		try {
			resolve(await steem_interface.transfer(_config.accounts.payment.name, _config.accounts.payment.name, purchase.payment, id, _config.accounts.payment.active_key));
		} catch (err) { reject(err); }
	});
}

module.exports = {
	init,
	purchase
}
