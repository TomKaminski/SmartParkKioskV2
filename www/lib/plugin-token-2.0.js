(function () {

    OpenPayU.extend({name: 'Token'}, {

        getValueByMap : function (keyMap, valueMap) {
            try {
                var val = valueMap;
                keyMap = keyMap.split(".");
                for(var i=0; i<keyMap.length; i++) {
                    val = val[keyMap[i]];
                }
                return val;
            } catch (ex) {
                return "";
            }
        },

        setValueByMap : function (keyMap, valueMap, newValue) {
            try {
                var val = valueMap;
                keyMap = keyMap.split(".");
                for(var i=0; i<keyMap.length; i++) {
                    if (i==keyMap.length-1) {
                        val[keyMap[i]] = newValue;
                    } else {
                        val = val[keyMap[i]];
                    }
                }
            } catch (ex) {
            }
        },

        normalize: function (rq, version, tokenRequest) {
            var model = OpenPayU.model[version][rq],
                mapping = model.mapping,
                normalize = model.normalize;
            for (var name in normalize) {
                var val = this.getValueByMap(mapping[name], tokenRequest);
                this.setValueByMap(mapping[name], tokenRequest, normalize[name](val));
            }
        },

        validate: function (rq, version, tokenRequest) {
            version = version || '2.0';
            var missing = [],
                model = OpenPayU.model[version][rq],
                mapping = model.mapping,
                mandatory = model.mandatory;

            for (var i = 0; i < mandatory.length; ++ i) {
                var name = mandatory[i];
                var val = this.getValueByMap(mapping[name],tokenRequest);

                if (name == '.payu-card-expm') {
                    a = OpenPayU.Validation.isMonth(val);
                    if (a != true) {
                        OpenPayU.log('Month is not valid');
                        missing.push([mapping[name], OpenPayU.Validation.ERR_FORMAT_INVALID]);
                    }
                }

                if (name == '.payu-card-expy') {
                    a = OpenPayU.Validation.isYear(val);
                    if (a != true) {
                        OpenPayU.log('Year is not valid');
                        missing.push([mapping[name], OpenPayU.Validation.ERR_FORMAT_INVALID]);
                    }
                }

                if (name == '.payu-card-number') {
                    a = OpenPayU.Validation.isNumeric(val);
                    if (a != true) {
                        OpenPayU.log('Field ' + name + ' is not numeric');
                        missing.push([mapping[name], OpenPayU.Validation.ERR_FORMAT_INVALID]);
                    }
                }

                if (name == '.payu-card-cvv') {
                    a = OpenPayU.Validation.validateCVV(val);
                    if (a != true) {
                        OpenPayU.log('CVV is not valid');
                        missing.push([mapping[name], OpenPayU.Validation.ERR_FORMAT_INVALID]);
                    }
                }
            }

            var expm = this.getValueByMap(mapping['.payu-card-expm'],tokenRequest);
            var expy = this.getValueByMap(mapping['.payu-card-expy'],tokenRequest);
            if (!OpenPayU.Validation.isDateValid(expm,expy)) {
                OpenPayU.log('Date has expired');
                missing.push(['card.expirationDate', OpenPayU.Validation.ERR_FORMAT_INVALID]);
            }

            if (OpenPayU.Validation.isValidLuhn(this.getValueByMap(mapping['.payu-card-number'],tokenRequest)) == 0) {
                OpenPayU.log('Card number is invalid');
                missing.push(['card.number', OpenPayU.Validation.ERR_FORMAT_INVALID]);
            }

            var email = this.getValueByMap(mapping['.payu-customer-email'],tokenRequest);
            if (email !== undefined && email !== '') {
                a = OpenPayU.Validation.isEmail(email);
                if (a != true) {
                    OpenPayU.log('Email is not valid');
                    missing.push([mapping[name], OpenPayU.Validation.ERR_FORMAT_INVALID]);
                }
            }

            if (missing.length == 0) {
                OpenPayU.log('Fields are valid for request: ' + rq + ', version: ' + version);
            } else {
                OpenPayU.log('Fields are not valid for request: ' + rq + ', version: ' + version);
            }

            return missing;
        },


        create: function (options, callback) {

            OpenPayU.log('-> token create, options: ' + JSON.stringify(options));

            var rq = 'TokenCreateRequest';

            var formatErrors = function (mf) {
                var validationErrors = {};
                for (var i = 0; i < mf.length; ++ i) {
                    validationErrors[mf[i][0]] = mf[i][1];
                }
                return validationErrors;
            }

            if (OPU('.payu-agreement').length > 0) {
                OPU('.payu-agreement').is(':checked') ? OPU('.payu-agreement').val('true') : OPU('.payu-agreement').val('false');
            }

            var mf = OpenPayU.validate(rq, '2.0');
            if (mf.length > 0) {
                OpenPayU.log('Validation error for token.create');
                return formatErrors(mf);
            }
            var msg = OpenPayU.Builder.createMessage(rq, '2.0');
            this.normalize(rq, '2.0', msg);
            mf = this.validate(rq, '2.0', msg);
            if (mf.length > 0) {
                OpenPayU.log('Field validation error for token.create');
                return formatErrors(mf);
            }
            msg.agreement = msg.agreement || 'false';
            // language detection
            var language = navigator.language || navigator.userLanguage;
            OpenPayU.Builder.setProp(msg, 'language', language);

            OpenPayU.Transport.send({request: rq, 'sender': OpenPayU.merchantId, data: msg}, function (data) {
                OpenPayU.log('<- transport callback, data: ' + JSON.stringify(data));
                if (callback) {
                    callback.call(this, data);
                }
            });

            OpenPayU.log('<- token create');
            return true;
        }
    });
})();
