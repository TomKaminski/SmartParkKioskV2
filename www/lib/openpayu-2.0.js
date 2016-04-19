(function (window, OPU, undefined) {

    function loadScript(src, callback) {
        var script = document.createElement('script');
        script.src = src;
        script.onload = script.onreadystatechange = function () {
            /**
             * readyState only exists in Internet explorer
             * to avoid executing multiple times "onreadystatechange" test for loaded readyState
             */
            if (typeof(this.readyState) == 'undefined' || this.readyState == 'loaded') {
                if (typeof(callback) == 'function') callback();
            }
        };

        var head = document.getElementsByTagName('head')[0];
        head.appendChild(script);
    }

    var getServer = function () {
        var serverAddress = '',
            regex = new RegExp('^((.*://)?[^/]*)/.*openpayu-2.0.js$');
        OPU('script[src]').each(function () {
            var result = this.src.match(regex);
            if (result !== null) {
                serverAddress = result[1];
                return false;
            } else {
                return true;
            }
        });
        return serverAddress;
    }

    var OpenPayU = {
        version: '2.0',
        plugins: [],
        server: getServer(),
        debug: true,
        model: {
            '2.0': {
                'TokenCreateRequest': {
                    mandatory: ['.payu-card-number', '.payu-card-expm', '.payu-card-expy'],
                    mapping: {
                        '.payu-card-cardholder': 'card.cardholder',
                        '.payu-card-number': 'card.number',
                        '.payu-card-cvv': 'card.cvv',
                        '.payu-card-expm': 'card.expirationMonth',
                        '.payu-card-expy': 'card.expirationYear',
                        '.payu-customer-email': 'email',
                        '.payu-agreement': 'agreement',
                        '.payu-customer-id': 'customerId'
                    },
                    normalize: {
                        '.payu-card-number': function (number) {
                            if (number !== undefined && number !== '') {
                                return number.replace('/[^0-9]+/','');
                            } else {
                                return number;
                            }
                        },
                        '.payu-card-expm': function (expm) {
                            if (expm !== undefined && expm !== '') {
                                return expm.length==1 ? '0'+expm : expm;
                            } else {
                                return expm;
                            }

                        },
                        '.payu-card-expy': function (expy) {
                            if (expy !== undefined && expy !== '') {
                                return expy.length==2 ? '20'+expy : expy;
                            } else {
                                return expy;
                            }

                        }
                    }
                }
            }
        },
        setup: function (options) {
            for (var key in options) {
                this[key] = options[key];
            }
        },
        init: function () {
            if (typeof(JSON) == 'undefined') {
                OPU(document).ready(function () {
                    loadScript(getServer() + '/res/v2/json2.js', OpenPayU.ready);
                });
            } else {
                OpenPayU.ready();
            }
        },
        log: function (dataLog) {
            if (this.debug && typeof console === 'object' && typeof console.log === 'function') {
                console.log(dataLog);
            }
        },
        ready: function () {
            OPU(document).ready(function () {
                for (i = 0; i < OpenPayU.plugins.length; i++) {
                    var name = OpenPayU.plugins[i];
                    thePlugin = OpenPayU[name];

                    if (thePlugin.ready) {
                        thePlugin.ready();
                    }
                }
            });
        },
        extend: function (options, body, replace) {
            /* method extends skeleton with plugin, followind the rules:
             * 1. if plugin exists and should not be replaced then return without any action (existing && !replace)
             * 2. if plugin exists and should be replaced then method replace the plugin and return existed/old plugin object (existing && replace)
             * 3. in all other cases plugin extends skeleton
             */
            replace = replace || true;
            var existing = (OPU.inArray(options.name, this.plugins) >= 0);
            var theCurrentValue = this[options.name] || null;

            if (existing && !replace) return theCurrentValue;

            var theExtension = this[options.name] = {};

            //add default setup function to each plugin !!!
            theExtension.setup = this.setup;

            for (var prop in body) {
                theExtension[prop] = body[prop];
            }

            if (theExtension.init) {
                theExtension.init();
            }

            if (existing) {
                return theCurrentValue;
            } else {
                this.plugins.push(options.name);
            }

            return theExtension;
        },
        validate: function (request, version) {
            var missing = OpenPayU.Validation.validate(request, version);
            return missing;
        },

        authorizeCVV: function (options, authorizeCvvCallback) {
            var status = 'SUCCESS';
            var cvv = OPU('.payu-card-cvv').val();

            var cvvValidationResult = OpenPayU.Validation.validateCVV(cvv);
            if (cvvValidationResult != true) {
                return 'WARNING_CONTINUE_CVV';
            }

            var refReqIdVal = options.url.match(/refReqId=(.*)/)[1];
            if (refReqIdVal == '' || refReqIdVal == null) {
                return 'ERROR_INTERNAL';
            }

            var data = {cvv: cvv, refReqId: refReqIdVal};
            try {
                OpenPayU.Transport.send({request: 'auth.cvv', data: data}, authorizeCvvCallback);
            } catch (ex) {
                status = 'ERROR_INTERNAL';
            }

            return status;
        },
        authorize3DS: function (options) {
            OpenPayU.Builder.createIframe('#payu-3dsecure-placeholder', {
                style: 'margin:0;border:0;width: 100%;height: 100%',
                src: options.url
            });
        }
    };

    OpenPayU.extend({name: 'Builder'}, {
        createHtmlElement: function (type, container, options) {
            var _obj = OPU('<' + type + '/>');
            for (var option in options) {
                _obj.attr(option, options[option]);
            }
            if (typeof container == 'string') container = OPU(container);

            container.append(_obj);
            return _obj;
        },
        createIframe: function (container, options) {
            return this.createHtmlElement('iframe', container, options);
        },
        createInput: function (container, options) {
            return this.createHtmlElement('input', container, options);
        },
        createDiv: function (container, options) {
            return this.createHtmlElement('div', container, options);
        },
        createMessage: function (rq, version) {
            var theMessage = {};
            var model = OpenPayU.model[version];
            var mapping = model[rq].mapping;
            for (var item in mapping) {
                var field = mapping[item];
                var value = OPU(item).val();
                this.setProp(theMessage, field, value);
            }
            return theMessage;
        },
        setProp: function(obj, desc, value) {
            var arr = desc.split(".");

            while (arr.length && obj) {
                var comp = arr.shift();
                var match = new RegExp("(.+)\\[([0-9]*)\\]").exec(comp);
                if ((match !== null) && (match.length == 3)) {
                    var arrayData = {
                        arrName: match[1],
                        arrIndex: match[2]
                    };
                    if (obj[arrayData.arrName] !== undefined) {
                        if (value && arr.length === 0) {
                            obj[arrayData.arrName][arrayData.arrIndex] = value;
                        }
                        obj = obj[arrayData.arrName][arrayData.arrIndex];
                    } else {
                        obj = undefined;
                    }
                    continue;
                }

                if (value) {
                    if (obj[comp] === undefined) {
                        obj[comp] = {};
                    }

                    if (arr.length === 0) {
                        obj[comp] = value;
                    }
                }
                obj = obj[comp];
            }
            return obj;
        },
        removePreloader: function () {
            OPU('.payu-preloader').animate({
                opacity: 0
            }, 500, function () {
                OPU(this).parent().remove();
            });
        },
        addPreloader: function (msg) {
            wH = OPU(window).height();
            wW = OPU(window).width();
            sP = OPU(window).scrollTop();

            if (typeof msg !== 'undefined') {
                OPU('body').append('<div id="payu-preloader-overlay"><div class="payu-preloader"></div><span class="payu-preloader-text">' + msg + '</span></div>');
            } else {
                OPU('body').append('<div id="payu-preloader-overlay"><div class="payu-preloader"></div></div>');
            }

            OPU('body').scrollTop(0);
            OPU('#payu-preloader-overlay').css({'width': wW - 20, 'height': wH + sP});
            OPU('.payu-preloader').css({'display': 'block'}).stop().animate({opacity: 1}, 500);
        }
    });

    OpenPayU.extend({name: 'Transport'}, {
        completeCallback: undefined,
        tunnelCreateCallbackList: [],

        config: {
            host: OpenPayU.server,
            url: OpenPayU.server + '/res/v2',
            timeout: 60000
        },
        jsonp: function (data) {
            OPU.ajax({
                url: this.config.url + '/api/v2/token.json',
                data: data.data,
                dataType: 'jsonp',
                type: 'POST',
                timeout: this.config.timeout,
                error: function (request, status, errorThrown) {
                    OpenPayU.log('Transport.jsonp, error: ' + status);
                },
                success: function (data) {

                    this.dispatchMessage(data);
                }
            });
        },
        postMessage: function (data) {
            var iframe = OPU('#payu-tunnel-iframe').get()[0].contentWindow;
            try {
                iframe.postMessage(JSON.stringify(data), this.config.host);
            } catch (err) {
                OpenPayU.log(err);
            }
        },
        dispatchMessage: function (message) {
            if (message) {
                if (message.type) {

                    if (message.type === 'message') {
                        data = message.data;
                        data = OPU.parseJSON(data);
                        if (data.callback && data.plugin) {
                            window['OpenPayU'][data.plugin][data.callback](data);
                        } else if (this.completeCallback) {
                            this.completeCallback.call(this, data);
                        }
                    }
                }
            }
        },
        onTunnelCreate: function (callback) {
            this.tunnelCreateCallbackList.push(callback);
        },
        //function executed when tunnel is successfully - may be oweritten by some plugin - installment for example to load data asyncronyus on loading plugin
        tunnelReady: function (data) {
            if (!data.successfully) {
                OpenPayU.log('Error loading tunnel');
                return false;
            }

            for (var key in this.tunnelCreateCallbackList) {
                this.tunnelCreateCallbackList[key]();
            }
        },
        init: function () {
        },
        ready: function () {

            if (typeof window.postMessage !== 'undefined') {
                OpenPayU.Builder.createIframe('body',
                    {
                        id: 'payu-tunnel-iframe',
                        src: this.config.url + '/tunnel.html'
                    }
                ).hide();
                that = this;
                var onMessage = function (e) {
                    that.dispatchMessage(e);
                }

                if (typeof window.addEventListener != 'undefined') {
                    window.addEventListener('message', onMessage, false);
                }
                else if (typeof window.attachEvent != 'undefined') {
                    window.attachEvent('onmessage', onMessage);
                }
            }
        },
        send: function (data, callback) {
            try {
                if (callback) this.completeCallback = callback;

                if (typeof window.postMessage === 'undefined') {
                    this.jsonp(data, callback);
                } else {
                    this.postMessage(data);
                }
            } catch (err) {
                OpenPayU.log(err);
            }
        },
        callMerchant: function (options, token) {
            var form = OPU('<form />').hide();
            form.attr('action', options.url).attr('method', 'POST');
            OPU('<input type="hidden"/>').attr({name: 'token', token: token}).appendTo(form);
            OPU('body').append(form);
            form.submit();
        }
    });

    OpenPayU.extend({name: 'Validation'}, {
        ERR_FIELD_MISSING: 'fieldMissing',
        ERR_FORMAT_INVALID: 'formatInvalid',

        init: function () {
        },
        ready: function () {
        },
        validate: function (rq, version) {
            version = version || '2.0';
            OpenPayU.log('version: ' + version);

            var missing = [],
                model = OpenPayU.model[version][rq],
                mandatory = model.mandatory,
                mapping = model.mapping;

            for (var i = 0; i < mandatory.length; ++ i) {
                var name = mandatory[i];
                if (OPU(name).length <= 0) {
                    OpenPayU.log('validation for ' + rq + ', missing field: ' + name);
                    missing.push([mapping[name], this.ERR_FIELD_MISSING]);
                }
            }

            if (missing.length == 0) {
                OpenPayU.log('html is valid for request: ' + rq + ', version: ' + version);
            } else {
                OpenPayU.log('html is not valid for request: ' + rq + ', version: ' + version);
            }

            return missing;
        },
        isValidLuhn: function (number) {
            if (this.isNumeric(number)) {
                CardNumber = number.toString();
                sumTable = [
                    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                    [0, 2, 4, 6, 8, 1, 3, 5, 7, 9]
                ];
                sum = 0;
                flip = 0;
                for (i = (CardNumber.length - 1); i >= 0; i--) {
                    sum += sumTable[flip++ & 0x1][CardNumber[i]];
                }
                return sum % 10 === 0;
            } else {
                return false;
            }
        },
        isDateValid: function (month, year) {
            var today = new Date(),
                currentMonth = today.getMonth() + 1,
                currentYear = today.getFullYear();

            if (year.length == 2) {
                currentYear = currentYear - 2000;
            }

            month = parseInt(month, 10);
            year = parseInt(year, 10);

            if (year > currentYear) {
                return true;
            } else {
                return year === currentYear && month >= currentMonth;
            }
        },
        isMonth: function (m) {
            a = '';
            reg = new RegExp('^[0-9][0-9]$');
            if (reg.test(m) && m >= 1 && m <= 12) {
                a = true;
            } else {
                a = false;
            }
            return a;
        },
        isYear: function (y) {
            a = '';
            reg2Digits = new RegExp('^[0-9][0-9]$');
            reg4Digits = new RegExp('^[0-9][0-9][0-9][0-9]$');

            if (reg2Digits.test(y)) {
                a = true;
            } else if (reg4Digits.test(y)) {
                a = (parseInt(y,10) < 2100);
            } else {
                a = false;
            }
            return a;
        },
        trim: function (str) {
            return typeof str == 'string' ? str.replace(/^\s+|\s+$/g, '') : '';
        },
        isNumeric: function (str) {
            str = String(str);
            return str.match(/^[0-9]+$/) !== null;
        },
        normalize: function (cardNumber) {
            return typeof cardNumber == 'string' ? cardNumber.replace(/\s+|-/g, '') : '';
        },
        validateCVV: function (cvv) {
            var c = this.trim(cvv);
            return this.isNumeric(c) && c.length >= 3 && c.length <= 4;
        },
        isEmail: function(email) {
            return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(email);
        }
    });

    window.OpenPayU = OpenPayU;
    OpenPayU.init();
}(window, $));

