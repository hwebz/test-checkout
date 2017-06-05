(function() {
	/* INIT CONSTANTS */
	/* =================================== */
	const PAYMENTWALL_USERNAME 	= 'devilart.93@gmail.com';
	const PROJECT_KEY 			= '808bea70a346e94b7a8dcbae514b2707';
	const PAYMENT_URL 			= 'https://api.paymentwall.com/api/payment-systems/';
	const GEOLOCATION_URL 		= 'https://api.paymentwall.com/api/rest/country?key='+PROJECT_KEY+'&uid='+PAYMENTWALL_USERNAME;
	const COUNTRIES_LIST_URL 	= 'https://restcountries.eu/rest/v2/all';

	const AMOUNT 				= 10;
	const CURRENCY				= 'USD';
	/* =================================== */

	/* VALIDATION */
	/* =================================== */
	var creditCardNumberRegexes = {
		"American Express": /^3[47][0-9]{13}$/,
		"Carte": /^389[0-9]{11}$/,
		"Diners Club": /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
		"Discover": /^65[4-9][0-9]{13}|64[4-9][0-9]{13}|6011[0-9]{12}|(622(?:12[6-9]|1[3-9][0-9]|[2-8][0-9][0-9]|9[01][0-9]|92[0-5])[0-9]{10})$/,
		"JCB": /^63[7-9][0-9]{13}$/,
		"Korean Local": /^9[0-9]{15}$/,
		"Laser": /^(6304|6706|6709|6771)[0-9]{12,15}$/,
		"Maestro": /^(5018|5020|5038|6304|6759|6761|6763)[0-9]{8,15}$/,
		"MasterCard": /^5[1-5][0-9]{14}$/,
		"Solo": /^(6334|6767)[0-9]{12}|(6334|6767)[0-9]{14}|(6334|6767)[0-9]{15}$/,
		"Switch": /^(4903|4905|4911|4936|6333|6759)[0-9]{12}|(4903|4905|4911|4936|6333|6759)[0-9]{14}|(4903|4905|4911|4936|6333|6759)[0-9]{15}|564182[0-9]{10}|564182[0-9]{12}|564182[0-9]{13}|633110[0-9]{10}|633110[0-9]{12}|633110[0-9]{13}$/,
		"Union": /^(62[0-9]{14,17})$/,
		"Visa": /^4[0-9]{12}(?:[0-9]{3})?$/,
		"Visa Master": /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})$/
	};

	var InputBehavior = function(parentFormId) {
		var autoTab = function(current, maxlength, destination) {
			current.unbind('keyup').bind('keyup', throttle(function(event) {
				if (event.keyCode != 9 && event.target.value.length == maxlength) { // tab key is not need to check
					destination.focus().select();
				}
			}, 200));
		}

		var init = function() {
			var inputs = $(parentFormId + " input");

			/* init for inputs which have data-dest && maxlength attrs */
			for(var i = 0; i < inputs.length; i++) {
				var input = $(inputs[i]);
				var maxlength = input.attr('maxlength');
				var dest = input.data('dest');

				if ((maxlength != undefined && maxlength != null)
					&& (dest != undefined && dest != null)) {
					autoTab(input, maxlength, $('#' + dest));
				}
			}
		}
		return {
			init: init	
		}
	}

	var Validation = function(){
		var isNumber = function(number) {
			var regex = /^[0-9]+$/;
			return regex.test(number);
		}

		var isValidDate = function(month, year) {
			/* Month and year must a valid number */
			if (!isNumber(month) || !isNumber(year)) return false;
			return true;
		}
		
		var isValidCVV = function(cvv) {
			/* CVV must be a number and have exact 3 or 4 characters length */
			if (!isNumber(cvv) || !(cvv.length == 3 || cvv.length == 4)) return false;

			/* if cvv = 111 thrown error, else return success message */
			if(parseInt(cvv) == 111) return false;
			return true;
		}

		var isValidCreditCard = function(creditCardNumber) {
			/* creditCardNumber must be a number */
			if (!isNumber(creditCardNumber)) return false;
			var isValid = false;
			/* Loop through the object to test creditCardNumber in each pattern */
			Object.keys(creditCardNumberRegexes).forEach(function(key, index) {
				try {
					var pattern = creditCardNumberRegexes[key];
					if (pattern.test(creditCardNumber)) {
						throw key;
					}
				} catch (e) {
					if (e = key) isValid = key;
				}
			});
			return isValid;
		}
		return {
			isNumber: isNumber,
			isValidDate: isValidDate,
			isValidCVV: isValidCVV,
			isValidCreditCard: isValidCreditCard
		}
	}
	/* =================================== */

	/* APP's CLASSES */
	/* =================================== */
	var UserLocation = function() {
		var getLocation = function() {
			return $.getJSON(GEOLOCATION_URL).done(function(response) {
				return response;
			}).fail(thrownError);
		}

		return {
			getLocation: getLocation
		}
	}

	var CountryList = function() {
		var getList = function() {
			return $.getJSON(COUNTRIES_LIST_URL).done(function(response) {
				return response;
			}).fail(thrownError);
		};

		return {
			getList: getList
		}
	}

	var PaymentMethods = function() {
		var paymentUrl = PAYMENT_URL + '?key='+PROJECT_KEY+'&country_code=';
		var getPaymentMethods = function(countryCode) {
			return $.getJSON(paymentUrl + countryCode).done(function(response) {
				return response;
			}).fail(thrownError);
		}

		return {
			getPaymentMethods: getPaymentMethods
		}
	}

	var PaymentDetails = function() {
		var getDetails = function(method) {
			var headerTitle = paymentDetailEle.find(".header h1");
			var priceTag = paymentDetailEle.find(".side .skew .btn");
			var dateGenerator = new DateGenerator();

			/* Hide payment methods form to go to payment defails form for checkout */
			paymentMethodsEle.addClass("hidden");
			paymentDetailEle.addClass("shown");

			/* Generate months and years*/
			paymentDetailEle.find(".form .exp #month").append(dateGenerator.generateMonth());
			paymentDetailEle.find(".form .exp #year").append(dateGenerator.generateYear());

			/* Bind method name, amount and currency to elements in payment details form*/
			headerTitle.text("Checkout with "+method);
			priceTag.text("Total: "+AMOUNT+" "+CURRENCY);
		}

		var pay = function(paymentInform) {
			var validation = new Validation();
			var now = new Date();
			var isValid = true;
			var errors = [];
			var cardType = '';
			/* Start to validate each fields */
			if (!validation.isValidDate(paymentInform.month, paymentInform.year)) {
				isValid = false;
				errors.push('exp');
			}

			if (now.getFullYear() > paymentInform.year) {
				errors.push('expire');
			} else if (now.getFullYear() == paymentInform.year) {
				if (now.getMonth() > paymentInform.month) {
					errors.push('expire');
				}
			}

			if (!validation.isValidCVV(paymentInform.cvv)) {
				isValid = false;
				errors.push('cvv');
			}
			cardType = validation.isValidCreditCard(paymentInform.creditCardNumber);
			if (!cardType) {
				isValid = false;
				errors.push('number');
			} else {
				showCardType(cardType);
			}
			showErrorMessage(errors);
			return isValid;
		}

		return {
			getDetails: getDetails,
			pay: pay
		}
	}

	var DateGenerator = function() {
		var monthNames = [ "January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December" ];
		var generateMonth = function() {
			var monthStr = "<option>- Select month -</option>";
			for(var i = monthNames.length - 1; i >= 0; i--) {
				monthStr += "<option value='"+i+"'>"+monthNames[i]+"</option>";
			}
			return monthStr;
		}

		var generateYear = function() {
			var currentYear = (new Date).getFullYear() + 20;
			var yearStr = "<option>- Select year -</option>";
			for(var i = currentYear; i >= 1970; i--) {
				yearStr += "<option value='"+i+"'>"+i+"</option>";
			}
			return yearStr;
		}
		return {
			generateMonth: generateMonth,
			generateYear: generateYear
		}
	}
	/* =================================== */

	/* UTIL FUNCTIONS */
	/* =================================== */
	function throttle(fn, threshhold, scope) {
		threshhold || (threshhold = 250);
		var last, deferTimer;
		return function () {
			var context = scope || this;

			var now = +new Date, args = arguments;
			if (last && now < last + threshhold) {
				// hold on to it
				clearTimeout(deferTimer);
				deferTimer = setTimeout(function () {
					last = now;
					fn.apply(context, args);
				}, threshhold);
			} else {
				last = now;
				fn.apply(context, args);
			}
		};
	}

	function thrownError(xhr, ajaxOptions, thrownError) {
		if (xhr) {
			$(".payment-loader").addClass("hidden");
			$(".error").addClass("shown").bind('click', '.form button', function(evt) {
				evt.preventDefault();
				$(this).removeClass("shown");
				return false;
			});
		}
	}

	function showErrorMessage(errors) {
		if (Array.isArray(errors)) {
			/* Hide all error field before re-display */
			paymentDetailEle.find(".form fieldset").removeClass("has-error");
			
			/* Show all errors */
			for(var i = 0; i < errors.length; i++) {
				if (errors[i] == 'expire') {
					/* Display custom error - expired card */
					paymentDetailEle.find(".exp .error").text("Expired!");

					paymentDetailEle.find(".exp").addClass("has-error");
				} else {
					paymentDetailEle.find("."+errors[i]).addClass("has-error");
				}
			}
		} else {
			paymentDetailEle.find("."+errors).addClass("has-error");
			if (errors[i] == 'number') {
				paymentDetailEle.find(".form .number .title").html("Card Number");
			}
		}
	}

	function showCardType(cardType) {
		/* Remove error for credit card number */
		paymentDetailEle.find(".form .number").removeClass("has-error");
		/* Find label has class name .number and append text to */
		paymentDetailEle.find(".form .number .title").html("Card Number - <span class='card-type'>"+cardType+"</span>");
	}
	/* =================================== */

	/* INIT VARIABLES & INITIALIZATION FOR APP */
	/* =================================== */
	var geo = new UserLocation();
	var countryList = new CountryList();
	var paymentMethods = new PaymentMethods();
	var paymentMethodsForm = $(".payment-methods .countries");
	var paymentMethodsEle = $(".payment-methods");
	var paymentDetailEle = $(".payment-details");
	var dropdown = paymentMethodsForm.find(".dropdown #exp");
	var paymentMethodsList = paymentMethodsForm.find(".payment-methods-list ul");

	function paymentMethodsLoader(methods, country) {
		var paymentDetails = new PaymentDetails();
		/* Show loader icon if its hidden */
		$(".payment-loader").removeClass('hidden');

		/* Show payment methods for selected country */
		methods.getPaymentMethods(country).then(function(data) {
			var methods = data;
			var methodsStr = '';
			$.each(methods, function(index, method) {
				var temp = {
					name: method.name,
					icon: method.img_url
				};
				methodsStr += '<li><a data-method="'+temp.name+'" href="#"><img src="'+temp.icon+'" alt="'+temp.name+'"/>'+temp.name+'</a></li>'
			});
			paymentMethodsList.empty().append(methodsStr ? methodsStr : '<li>No payment methods.</li>');

			/* Attach event for each listing item to go to payment checkout 
			   page with corresponding payment method
			*/
			paymentMethodsList.find("li a").on('click', function(evt) {
				evt.preventDefault();
				var _this = $(this);
				var method = _this.data('method');

				paymentDetails.getDetails(method);

				return false;
			});

			/* Attach event for 'Pay' button for starting checkout with validation */
			paymentDetailEle.find(".form button").on('click', function(evt) {
				evt.preventDefault();
				/* Get the values from forms to validate before process checkout */
				var paymentInform = {
					creditCardNumber: escape($.trim(paymentDetailEle.find(".form #first").val()))
								+ escape($.trim(paymentDetailEle.find(".form #second").val()))
								+ escape($.trim(paymentDetailEle.find(".form #third").val()))
								+ escape($.trim(paymentDetailEle.find(".form #fourth").val())),
					month: escape($.trim(paymentDetailEle.find(".form #month").val())),
					year: escape($.trim(paymentDetailEle.find(".form #year").val())),
					cvv: escape($.trim(paymentDetailEle.find(".form #cvv").val()))
				}

				if (paymentDetails.pay(paymentInform)) {
					$(".modal.success").addClass("shown");
				}
				return false;
			});

			paymentDetailEle.find(".form .number input").unbind('keypress').bind('keypress', throttle(function(evt) {
				/* Get the values from forms to validate credit card number */
				var paymentInform = {
					creditCardNumber: escape($.trim(paymentDetailEle.find(".form #first").val()))
								+ escape($.trim(paymentDetailEle.find(".form #second").val()))
								+ escape($.trim(paymentDetailEle.find(".form #third").val()))
								+ escape($.trim(paymentDetailEle.find(".form #fourth").val())),
					month: escape($.trim(paymentDetailEle.find(".form #month").val())),
					year: escape($.trim(paymentDetailEle.find(".form #year").val())),
					cvv: escape($.trim(paymentDetailEle.find(".form #cvv").val()))
				}

				var validation = new Validation();
				var cardType = validation.isValidCreditCard(paymentInform.creditCardNumber);
				if (cardType) {
					showCardType(cardType);
				} else {
					showErrorMessage('number');
				}
			}, 1000));

			/* Hide loader when country list loaded & default country was set */
			$(".payment-loader").addClass("hidden");
		}); 
	}

	countryList.getList().then(function(data) {
		/* Show country list in dropdown */
		var countries = data;
		var countriesStr = '';
		$.each(countries, function(index, country) {
			countriesStr += '<option value="'+country.alpha2Code+'">'+country.name+'</option>';
		});
		dropdown.append(countriesStr);

		/* Set default country based on user's geolocation */
		geo.getLocation().then(function(data) {
			var defaultCountry = data.code;
			dropdown.val(defaultCountry);

			paymentMethodsLoader(paymentMethods, defaultCountry);
		});

		/* Attack event for dropdown item to show payment methods
		   corresponding to selected country 
		*/
		dropdown.on('change', function(evt) {
			var selectedCountry = $(this).val();

			paymentMethodsLoader(paymentMethods, selectedCountry);
		});
	});

	/* add behavior for inputs in checkout page */
	var behaviors = new InputBehavior('#form');
	behaviors.init();

})();