// ==UserScript==
// @name        Cryptobetfair
// @namespace   cbfverifier.gielbier.clientsideverif
// @description Clientside JS Verifier - Cryptobetfair.com
// @include     https://cryptobetfair.com/coindrop.html*
// @include     https://cryptobetfair.com/dice.html*
// @include		https://cryptobetfair.com/wheel.html*
// @version     1
// @grant     	none
// @require		http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha256.js
// @require   http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/hmac-sha256.js
// @require		http://crypto-js.googlecode.com/svn/tags/3.1.2/build/components/enc-base64-min.js
// @require		https://raw.githubusercontent.com/kvz/phpjs/master/functions/misc/pack.js
// @require   https://raw.githubusercontent.com/kvz/phpjs/master/workbench/misc/unpack.js
// @require   https://raw.githubusercontent.com/kvz/phpjs/master/functions/strings/bin2hex.js
// @require   https://raw.githubusercontent.com/kvz/phpjs/master/functions/strings/str_split.js
// @require   https://raw.githubusercontent.com/kvz/phpjs/master/functions/math/hexdec.js

// ==/UserScript==
console.log("CBF Userscript loaded");

layer();
var dseeds = [];
var allmybets = [];
var monitoring = 'off';
var everyonebets = [];
var storedbetresults = [];
var newseed = false;
$(document).on('fairFill', function(){
    newseed = true;
    console.log("FAIRFILL");
       $.get("seeds.txt", function (data) {
       dseeds = data.split("\n");
       dseeds.shift();
       checkchain(dseeds);
       console.log("Seeds Reloaded");
               })  .done(function( data ) {
                newseed = false;
              });
});


// Hook to ajaxcalls to monitor bets.
$(document).ajaxSuccess(
        function (event, xhr, settings) {
            var url = settings.url;
            if (url.indexOf('d/u/bet.php') > -1 || url.indexOf('d/i/fair.php') > -1 || url.indexOf('d/u/rekey.php') > -1) {
                var json = JSON.parse(xhr.responseText);
                var d = json.fair;
                seedstore[d.betctr] = {
                    shash: d.shash,
                    dhash: d.dhash,
                    sseed: d.sseed,
                    fseed: d.fseed,
                    cseed: d.cseed,
                    betctr: d.betctr
                };
                console.log("FAIR");
            }



            if (url.indexOf("chat") > -1 && xhr.responseText.length > 0) {
                var json = JSON.parse(xhr.responseText);
                $.each(json, function (index, value) {
                    if (value != null && value.c != null ) {
                        if ((value.c).indexOf('recentbets') > -1){
                        var thisuser = $(".popout-info span").text().replace(/ /g, '');


                        if (thisuser == value.d.player) {
                            checkbetbyid2(value.d.id);
                            allmybets.push(value.d);
                        } else {
                            if (monitoring == 'on') {
                                checkbetbyid(value.d.id);
                            }
                            everyonebets.push(value.d)
                        }
                    }
                    }
                });
            }
        }
);


function togglemonitor() {
    if (monitoring !== 'on') {
        monitoring = 'on';
        document.getElementById("monstat").innerHTML = '<a href="#" class="green "><i class="fa fa-circle"> <span class="force-font bold">Monitoring: <span>On</span></span></i> </a>';
    }
    else {
        monitoring = 'off';
        document.getElementById("monstat").innerHTML = '<a href="#" class=" "><i class="fa fa-circle"> <span class="force-font bold">Monitoring: <span>Off</span></span></i> </a>';

    }
}

document.onkeyup = function (e) {
    if (e.keyCode == '145') {
        togglemonitor()
    }
    if (e.keyCode == '120') {
        //f9
        mybetcheck();
    }
}


function checkbetbyid(betid) {
    
    console.log("Checking BET:" + betid);
        if (newseed == true){
       $.get("seeds.txt", function (data) {
       dseeds = data.split("\n");
       dseeds.shift();
       checkchain(dseeds);
       console.log("Seeds Reloaded");
           newseed = false;
       })  .done(function( data ) {
    checkbetbyid(betid);
           
  });
     return;   
    }
    if (betid != null) {
        $.get("https://cryptobetfair.com/d/i/showbet.php?id=" + betid, function (data) {
            if (data.bet != null) {
                var b = data.bet;
                var res = check2(b);
                if (res == '1' || res == '2') {
                    var mytext = betid + " v";
                    console.log(mytext);
                    display2(betid, 1);
                } else {
                    var mytext = betid + " X FAILED!!";
                    console.log(mytext);
                    display2(betid, 4);
                }
            }
        });
    }
}

function checkbetbyid2(betid) {
            if (newseed == true){
       $.get("seeds.txt", function (data) {
       dseeds = data.split("\n");
       dseeds.shift();
       checkchain(dseeds);
       console.log("Seeds Reloaded");
           newseed = false;
       })  .done(function( data ) {
    checkbetbyid2(betid);
           
  });
     return;   
    }
    console.log("Checking BET:" + betid);
    if (betid != null) {
        $.get("https://cryptobetfair.com/d/i/showbet.php?id=" + betid, function (data) {
            if (data.bet != null) {
                var b = data.bet;

                if (b.shash == seedstore[b.betctr].shash) {
                    document.getElementById("seedsstat").innerHTML = '<a href="#" class="green bold"><i class="fa fa-circle"> <span class="force-font bold">Seedmatch:<span>pass</span></span></i> </a>';
                } else {
                    console.log(seedstore[b.betctr].shash + " || " + b.shash + "\n" + b.betctr);
                    document.getElementById("seedsstat").innerHTML = '<a href="#" class="bold red"><i class="fa fa-circle"> <span class="force-font bold">Seedmatch:<span>fail</span></span></i> </a>';
                }
                var res = check2(b);
                if (res == '2' || res == '1') {
                    var mytext = betid + " v";
                    console.log(mytext);
                    display2(betid, res);
                    display(betid, res);
                } else {
                    var mytext = betid + " BET VERIFICATION FAILED!!";
                    console.log(mytext);
                    display2(betid, 4);
                    display(betid, 4);
                }
            }
        });
    }
}



function mybetcheck() {
    var mybets = [];
    console.log("Getting bets");
    $('#myBets tbody tr').each(function () {
        var counterje = 1;
        
        $(this).find('td a').each(function () {
            var thebet = $(this).text();
            thebet = parseInt(thebet);
            display(thebet, 3);
            var correct = [];
            correct[thebet] = false;
            $.get("https://cryptobetfair.com/d/i/showbet.php?id=" + thebet, function (data) {
                var b = data.bet;
                var res = check2(b);
                if (res == '2' || res == '1') {
                    correct[thebet] = "CORRECT";
                    var mytext = thebet + " v";
                    display(thebet, res);
                    console.log(mytext);
                } else {
                    var mytext = thebet + " X FAILED!!";
                    display(thebet, 4);
                    console.log(mytext);
                }
            });
        })
    });

}



function display2(betid, num) {
    num = parseInt(num);
    var mytr = $("#recentBets tbody").find("[data-betid='" + betid + "']")
    switch (num) {
        case 1:
            var text = '<i class="fa fa-check-circle-o green"></i>';
            break;
        case 2:
            var text = '<i class="fa fa-check-circle-o green"></i><i class="fa fa-check-circle-o green"></i>';
            break;
        case 3:
            var text = '<i class="fa fa-question-circle gold"></i>';
            break;
        case 4:
            var text = '<i class="fa fa-times-circle-o red"></i>';
            break;
    }

    $(mytr).find('.betCheck').html(text);
}

function display(betid, num) {
    num = parseInt(num);
    var mytr = $("#myBets tbody").find("[data-betid='" + betid + "']");
    switch (num) {
        case 1:
            var text = '<i class="fa fa-check-circle-o green"></i>';
            break;
        case 2:
            var text = ' <i class="fa fa-check-circle-o green"></i><i class="fa fa-check-circle-o green"></i>';
            break;
        case 3:
            var text = ' <i class="fa fa-question-circle gold"></i>';
            break;
        case 4:
            var text = ' <i class="fa fa-times-circle-o red"></i>';
            break;
    }

    $(mytr).find('.betCheck').html(text);
}


function check2(b) {
    lazycounter();

    var endresult = [];
    var betid = b['id'];
    endresult.betid = betid;
    var betctr = b['betctr'];
    var cseed = pack('H*', b['cseed']);
    var fseed = pack('H*', b['fseed']);
    var sseed = pack('H*', b['sseed']);
    var shash = pack('H*', b['shash']);
    if (b['dseed'] == null) {
        dseed == null
    } else {
        var dseed = pack('H*', b['dseed'])
    }
    ;
    var dhash = pack('H*', b['dhash']);
    var user = b['user'];
    var game = b['game'].toLowerCase();
    var result = b['multiplier'];
    var tocheckres = b['multiplier'] * 100;
    tocheckres = Math.floor(tocheckres) / 100;
    var multiply = b['multiplier'];
    var param = b['param'];
    // var dseeds
    var checks = [];
    var my_dhash = null;
    var resulttocheck = multiply;
    checks['betid'] = betid;

//===================================================================================
// Verification happens here:
    checks['hashchain integrity'] = null;
    for (i = 0; i < dseeds.length; i++) {
        var line = dseeds[i];
        var fields = line.split("\t");

        if (typeof fdhash !== 'undefined') {
            var f_dseed = fdhash;
        }
        var fdhash = pack('H*', fields[1]);
        if (typeof f_dseed !== 'undefined') {
            if (checks['hashchain integrity'] == null) {
                checks['hashchain integrity'] = 'pass';
            }
            if (fields[1].toString() != CryptoJS.SHA256(CryptoJS.enc.Latin1.parse(f_dseed)).toString()) {
                checks['hashchain integrity'] = 'fail';

            } else {
            }
        }

        if (parseInt(fields[2].trim()) < betid && my_dhash == null) {
            my_dhash = fdhash;
            if (typeof f_dseed !== 'undefined') {
                my_dseed = f_dseed;
            }
        }
    }
    checks['this dhash = published dhash'] = dhash == my_dhash ? 'pass' : 'fail';
    endresult.dhash = checks['this dhash = published dhash'];



    if (dseed == null) {
        checks['sseed = hmac_sha256(username:betctr, dseed)'] = 'no data provided';
        checks['dhash = sha256(dseed)'] = 'no data provided';
    } else {
        var hash1 = CryptoJS.SHA256(CryptoJS.enc.Latin1.parse(dseed));
        hash1 = hash1.toString(CryptoJS.enc.Latin1);
        if (dhash == hash1) {
            checks['dhash = sha256(dseed)'] = 'pass';
        } else {
            checks['dhash = sha256(dseed)'] = 'fail';
        }
        var hmac = CryptoJS.HmacSHA256(user + ':' + betctr, CryptoJS.enc.Latin1.parse(dseed));
        hmac = hmac.toString(CryptoJS.enc.Latin1);
        checks['sseed = hmac_sha256(user:betctr,dseed)'] = sseed == hmac ? 'pass' : 'fail';
    }
    var hash2 = CryptoJS.SHA256(CryptoJS.enc.Latin1.parse(sseed));
    hash2 = hash2.toString(CryptoJS.enc.Latin1);
    checks['shash = sha256(sseed)'] = shash == hash2 ? 'pass' : 'fail';
    var hmac2 = CryptoJS.HmacSHA256(CryptoJS.enc.Latin1.parse(cseed), CryptoJS.enc.Latin1.parse(sseed));
    hmac2 = hmac2.toString(CryptoJS.enc.Latin1);
    checks['fseed = hmac_sha256(cseed, sseed)'] = fseed == hmac2 ? 'pass' : 'fail';

    switch (game) {


        case 'spin':
            //  alert("spin");
            checks['correct result'] == 'fail';
            var resultsspin = ['1.25', '0.25', '1.25', '0',
                '2', '0.35', '2', '0.4',
                '1.25', '0.25', '1.25', '0',
                '3', '0', '1.5', '0.25'];
            var seg = unpack('C*', fseed);
            seg = seg[1] >> 4 & 0x0F;
            var res1 = (resultsspin[seg]) * 100;
            var res2 = tocheckres * 100;
            if (parseInt(res1) == parseInt(res2)) {
                checks['correct result'] = 'pass';
            } else {
                checks['correct result'] = 'fail';
            }
            break;

        case 'drop':
            var dropresult;
            if (betid > 3393416) {
                var results = ['1', '0.3', '1.5', '0', '3', '0', '1.5', '0.3', '1'];
            } else {
                var results = ['1', '0.4', '1.5', '0', '3', '0', '1.5', '0.4', '1'];
            }
            var slot = param.split("=");
            var mystring = CryptoJS.HmacSHA256(CryptoJS.enc.Latin1.parse(slot[1]), CryptoJS.enc.Latin1.parse(fseed));
            var mystring = mystring.toString(CryptoJS.enc.Latin1);
            var segs2 = unpack('C*', mystring);
            var seg;
            checks['correct result'] == 'fail';
            for (i = 1; i < 64; i++) {
                seg2 = segs2[i];
                var seg = (seg2 >> 4) & 0x0F;
                if (seg < 9) {
                    if (parseInt(tocheckres) == parseInt(results[seg])) {
                        checks['correct result'] = 'pass';
                        dropresult = results[seg];
                    }
                    break;
                }
                seg = seg2 & 0x0F;
                if (seg < 9) {
                    if (parseInt(tocheckres) == parseInt(results[seg])) {
                        checks['correct result'] = 'pass';
                        dropresult = results[seg];
                    }
                    break;
                }
                seg = 4;
                if (parseInt(tocheckres) == parseInt(results[seg])) {
                    checks['correct result'] = 'pass';
                    dropresult = results[seg];
                }
            }
            break;

        case 'dice':
            var edge = "0.01";
            var hi = param.substring(0, 1) == '>' ? true : false;
            var target = param.substring(1) * 10000;
            var target = parseInt(target);
            var res = hi ? 1000000 : 0;
            var resarr = str_split(bin2hex(fseed), 5);
            for (var x = 0; x < resarr.length; x++) {
                var s = resarr[x];

                if (s.length == 5) {
                    var d = hexdec(s);
                    if (d < 1000000) {
                        var res = d;
                        break;
                    }
                }
            }

            if (betid > 192992 && betid < 4544134) {
                edge = "0.015";
                console.log("Old edge");
            }

            if ((hi && res > target) || (!hi && res < target)) {
                var t_target = hi ? 1000000 - target : target;
                
                var part1 = ((1000000 * 10e12) / (t_target * 10e12))/1e12;
                
                //var part1 = bcdiv(1000000 - t_target, 12);
                var part2 = 1 - edge;
                var win = ((part1 * 1e12) * (part2 * 1e12))/1e12
                //var win = bcmul(part1, part2, 12);
                var win = Math.round(win * 100000000) / 100000000;
            } else {
                var win = "0.00000000";
                // var win = "0";
            }
            console.log(win + "==" + result);
            if (win == result) {
                checks['correct result'] = 'pass';
            } else {
                checks['correct result'] = 'fail';
            }

            break;
    }



    console.log(checks);

    if (checks['correct result'] == 'pass' &&
            checks['hashchain integrity'] == 'pass' &&
            checks['fseed = hmac_sha256(cseed, sseed)'] == 'pass' &&
            checks['this dhash = published dhash'] == 'pass' &&
            checks['fseed = hmac_sha256(cseed, sseed)'] == 'pass' &&
            checks['dhash = sha256(dseed)'] == 'pass' &&
            checks['this dhash = published dhash'] == 'pass' &&
            checks['sseed = hmac_sha256(user:betctr,dseed)'] == 'pass'
            ) {
        return '2';
    }
    if (checks['correct result'] == 'pass' &&
            checks['hashchain integrity'] == 'pass' &&
            checks['fseed = hmac_sha256(cseed, sseed)'] == 'pass' &&
            checks['this dhash = published dhash'] == 'pass' &&
            checks['fseed = hmac_sha256(cseed, sseed)'] == 'pass' &&
            checks['this dhash = published dhash'] == 'pass') {
        return '1';
    }
    else {
        return 'false';
    }
}



var seedstore = [];
$(document).on('userload', function (e, d) {
    console.log({e: e, d: d});
});
$(document).on('fairFill', function (e, d) {
    console.log({e: e, d: d});
});




function validate2() {
    $.get("seeds.txt", function (data) {
        //alert( "Load was performed." );
        lines = data.split("\n");
        lines.shift();
        checkchain(lines);
    });

}
var lastseeddate
function checkchain(dseeds) {
    var hashchain = []
    for (i = 0; i < dseeds.length; i++) {
        var line = dseeds[i];
        var fields = line.split("\t");
        hashchain.push(fields[1]);
        if (i === dseeds.length - 1) {
            check(hashchain);
        }
        if (i === 0) {
            lastseeddate = fields[0];
        }
    }
}
function check(hashchain) {
    var cbfc = 0;
    var cbfe = 0;
    var g = 0;
    for (i = 0; i < hashchain.length; i++) {
        if (i !== 0) {
            var f_dseed = CryptoJS.enc.Latin1.parse(fdhash);
        }
        var fdhash = pack('H*', hashchain[i]);
        var hash = CryptoJS.SHA256(f_dseed);
        var checker1 = hashchain[i].toString();
        var checker2 = hash.toString();
        if (checker1 !== checker2 && i !== 0) {
            g++;
        }
        if (hashchain[i] == hash) {
            console.log("#" + i + "  " + hashchain[i] + " :  " + hash);
            cbfe++;
        }
    }
    console.log("Checked:" + i + "|| Correct:" + cbfe + "|| Incorrect" + g );
    if (i - 1 == cbfe && g < 1) {
        console.log("Seedchain correct");
        document.getElementById("hashstat").innerHTML = '<a href="#" class="green bold"><i class="fa fa-circle"> <span class="force-font bold">Hashchain: <span>Correct!</span></span></i> </a>';
    } else {
        document.getElementById("hashstat").innerHTML = '<a href="#" class="red bold"><i class="fa fa-circle"> <span class="force-font bold">Hashchain: <span>Incorrect!</span></span></i> </a>';
        console.log("!! Seedchain incorrect !!");
    }
}


function layer() {
    var newHTML = document.createElement('div');
    newHTML.className = "stats-nav";
    newHTML.innerHTML = '<div class="container"><div class="navbar-xs"><ul class="nav navbar-nav pull-left"><li><a>CryptoBetFair Validator</a></li><li><a ><i class="fa fa-ticket"></i> Validated Bets : <span id="valbetcount" >0</span></a></li></ul><ul class="nav navbar-nav pull-right"><li id="verifymybets"><a href="#" > Validate MyBets </a></li><li id="monstat"><a href="#" class=""><i class="fa fa-circle"> <span class="force-font bold">Monitoring: <span>OFF</span></span></i> </a></li><li id="hashstat"><a href="#" class="green red"><i class="fa fa-circle"> <span class="force-font bold">HashChain: <span>?</span></span></i> </a></li><li id="seedsstat"><a href="#" class=""><i class="fa fa-circle"> <span class="force-font bold">Seedmatch:<span>?</span></span></i> </a></li></ul></div></div>';
    document.body.insertBefore(newHTML, document.body.firstChild)
    $('#monstat').click(function () {
        togglemonitor();
        return false;
    });
    $('#verifymybets').click(function () {
        mybetcheck();
        return false;
    });
    $('#hashstat').click(function () {
        validate2();
        return false;
    });
}

var totalbetcount = 0;
function lazycounter() {
    totalbetcount++;
    document.getElementById("valbetcount").innerHTML = totalbetcount;
}

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
