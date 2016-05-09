var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic('./')).listen(3000);

var pcsc = require('pcsclite')();

var cardHelperData = {
   SFI: null,
   PSEStartFrom: null
}

// PC/SC interface.
pcsc.on('reader', function(reader) {
    console.log('Reader detected:', reader);

    reader.on('error', function(err) {
        console.log(err.message);
    });

    reader.on('status', function(status) {
        // Check changes.
        var changes = this.state ^ status.state;
        if (changes) {
            
            // Card removed.
            if ((changes & this.SCARD_STATE_EMPTY) && (status.state & this.SCARD_STATE_EMPTY)) {
                console.log('Card removed');
                
                reader.disconnect(reader.SCARD_LEAVE_CARD, function(err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log('Disconnected');
                    }
                });

            }

            // Card inserted.
            else if ((changes & this.SCARD_STATE_PRESENT) && (status.state & this.SCARD_STATE_PRESENT)) {
                console.log('Card inserted');
                
                reader.connect(function(err, protocol) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        var message = new Buffer([0x00, 0xA4, 0x04, 0x00, 0x0E, 0x31, 0x50, 0x41, 0x59, 0x2E, 0x53, 0x59, 0x53, 0x2E, 0x44, 0x44, 0x46, 0x30, 0x31]);
			reader.transmit(message, 1024, protocol, function(err, data) {
                            if (err) {
                                console.log(err);
                            }
                            else {
				console.log('Message data: ', data);
				console.log();
				for(var i = 0; i < data.length; i++){
				   if(data[i] == 0x84){
				      //console.log('Index of DF Name indicator: ', i);
				      //console.log('Starting index of DF Name: ', i +2);
				      //console.log('Length of DF Name: ', data[i+1]);
				      console.log('DF Name: ', hex2ASCI(data, i +2, data[i+1]));
 				      break;
			           }
				}
				for(var j = 0; j < data.length; j++){
				   if(data[j] == 0x88){
				      //console.log('Index of SFI of the Directory Elementary File: ', j);
				      //console.log('Length of SFI is: ', data[j+1]);
				      console.log('SFI: ', data[j+2]);
				      cardHelperData.SFI = data[j+2];
				      cardHelperData.PSEStartFrom = (cardHelperData.SFI << 3  | 4).toString();
				      console.log(cardHelperData.PSEStartFrom);
 				      break;
			           }
				}
				for(var k = 0; k < data.length; k++){
				   if(data[k] == 0x5F && data[k+1] == 0x2D){
				      //console.log('Index of language: ', k);
				      //console.log('Length of language: ', data[k+2]/2);
				      console.log('Language: ', hex2ASCI(data, k+3, data[k+2]/2));
 				      break;
			           }
				}
                                var invalidReadRecordCommand = new Buffer([0x00, 0xB2, 0x01, (cardHelperData.SFI << 3  | 4), 0x00]);
				console.log('Invalid read record data: ',invalidReadRecordCommand);
				reader.transmit(invalidReadRecordCommand, 1024, protocol, function(err, data) {
	                           if (err) {
	                               console.log(err);
	                           }
	                           else {
	                	       console.log('Invalid read record data: ', data);
			    	   }
			        });
                        }});
                    }
                });
            }
        }
    });

    reader.on('end', function() {
        console.log('Status(', reader.name, '): Removed');

        // Release resources.
        reader.close();
        pcsc.close();
    });
});

pcsc.on('error', function(err) {
    console.log('Error( PCSC ): ', err);
});


function hex2ASCI(data, startIndex, length){
   var languageString = '';
   for(var i=startIndex; i<startIndex+length;i++){
      languageString += String.fromCharCode(data[i]);
   }
   return languageString;
}
