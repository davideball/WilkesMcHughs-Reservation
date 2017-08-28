/* Reservation Id localStorage:
    KEY = RId
    JSON = { RId: 1 } */
/* Reservation / FulFilled Data localStorage:
    KEY = Reservations / FulFilled
    JSON = { id: N, datetime: DateTime, seats: N, name: "John Doe", seated: false } */

$(document).ready(function () {
    StartClock();

    NewReservationBtn.on("click", NewReservation);
    Seats.spinner({
        change: function () {
            var inputVal = $(this);
            if (inputVal.val().length === 0) {
                inputVal.addClass('warning');
            } else
                inputVal.removeClass('warning');
            },
            min: 1,
            max: 12
    });
    rDate.datepicker({
        minDate: new Date()
    });
    Hours.spinner({
        change: function () {
            var inputVal = $(this);
            if (inputVal.val().length === 0) {
                inputVal.addClass('warning');
            } else
                inputVal.removeClass('warning');
        },
        min: 1,
        max: 12
    });
    Minutes.minutespinner({
        change: function ()
        {
            var inputVal = $(this);
            if (inputVal.val().length === 0) {
                inputVal.addClass('warning');
            } else
                inputVal.removeClass('warning');
        }
    });
    AmPm.ampmspinner({
        change: function () {
            var inputVal = $(this);
            if (inputVal.val().length === 0) {
                inputVal.addClass('warning');
            } else
                inputVal.removeClass('warning');
        }
    });
    DayWeekMonth.checkboxradio();

    // Reservation data
    ReservationId = GetCurrentRId();
    ListReservations(DayWeekMonth.val());
    ListFulfilled();
});

/* INFRASTRUCTURE */
var GetCurrentRId = function () {
    var id = GetData(ReservationIdKey);
    return (id !== null) ? id.RId : 1;
}

var CreateNewRId = function (rId) {
    var id = (Number(rId));
    ++id;
    PostData(ReservationIdKey, { RId: id });
    return id;
}

var NewReservation = function () {
    var self = $(this);

    divReservation.removeClass('hidden');

    divReservation.dialog(
        {
            minWidth: 350,
            title: "New Reservation",
            modal: true,
            buttons: [
                {
                    text: "OK",
                    click: function () {
                        // Validation
                        var isValid = IsReservationValid();
                        if (isValid)
                        {
                            var dateString = FormatDateYMDT(rDate.val(), Hours.val(), Minutes.val(), AmPm.val());
                            CreateReservation(new Date(dateString), Seats.val(), Name.val());
                            SelectedTimeFrame = $(":radio:checked");
                            ListReservations(SelectedTimeFrame.val());
                            $(this).dialog("close");
                        }
                    },
                    close: function () {
                        $(":text").val("");
                    }
                }
            ]
        });
}

var ListReservations = function (listType) {
    var allReservations = GetData(ReservationKey);
    var sortedReservations = SortListDate(allReservations);
    var todaysSeatCount = 0;

    if (sortedReservations !== null) {
        divReservations.empty(); // Empty the html control

        var hasData = false;
        for (var i = 0; sortedReservations.length > i; i++) {
            
            var _reservation = allReservations.find(function (reservation) {
                if (reservation.id === sortedReservations[i][1])
                    return reservation;
            });

            var reservationDate = new Date(_reservation.datetime);
            var date = new Date();
            var secondsWeek = (7 * 24 * 60 * 60 * 1000);
            var secondsMonth = (30 * 24 * 60 * 60 * 1000);
            var container;

            if (!_reservation.seated) { 
                var formattedYYYMMDDTHHMMTT = FormatTime(_reservation.datetime);
                switch (listType) {
                    case "day":
                        if (reservationDate.toDateString() == date.toDateString()) {
                            container = ReservationHtml(_reservation.id, Get12HourTime(_reservation.datetime), _reservation.name, _reservation.seats);
                            divReservations.append(container);
                            hasData = true;
                            todaysSeatCount += Number(_reservation.seats);                           
                        }
                        break;
                    case "week":                        
                        if (reservationDate <= new Date(date.getTime() + secondsWeek)) {
                            container = ReservationHtml(_reservation.id, formattedYYYMMDDTHHMMTT, _reservation.name, _reservation.seats);
                            divReservations.append(container);
                            hasData = true;
                        }
                        break;
                    case "month":
                        if (reservationDate <= new Date(date.getTime() + secondsMonth)) {

                            container = ReservationHtml(_reservation.id, formattedYYYMMDDTHHMMTT, _reservation.name, _reservation.seats);
                            divReservations.append(container);  
                            hasData = true;
                        }
                        break;
                    case "all":
                        container = ReservationHtml(_reservation.id, formattedYYYMMDDTHHMMTT, _reservation.name, _reservation.seats);
                        divReservations.append(container);
                        hasData = true;
                        break;
                    default:
                }
            }
        }

        if (!hasData)
        {
            divReservations.append(noDataFound);
            ReservationHeader.addClass("hidden");
        }
        else
        {
            ReservationHeader.removeClass("hidden");
        }
        if (todaysSeatCount > 0)
            h4Seats.text(h4Seats.text() + '(' + todaysSeatCount + ')');
        else
            h4Seats.text("Seats");
    }
}

var ListFulfilled = function () {
    var _allFulFilled = GetData(FulfilledKey);

    if (_allFulFilled != null) {
        divFulfilled.empty();
        fulfilledAccordion.addClass("block");

        var header = $('<div/>', {
            "class": 'col-xs-12 text-center boldText'
        });

        header.append(headerSeated);
        header.append(headerDate);
        header.append(headerName);
        header.append(headerEmpty);

        divFulfilled.append(header);

        var sortedFilled = SortListDate(_allFulFilled);
        for (var i = 0; _allFulFilled.length > i; i++) {

            var _filfilled = _allFulFilled.find(function (filfilled) {
                if (filfilled.id === sortedFilled[i][1])
                    return filfilled;
            });

            if (_filfilled.seated && FormatTime(_filfilled.datetime)) {
                var container = FulfilmentHtml(_filfilled.id, _filfilled.seats, FormatTime(_filfilled.datetime), _filfilled.name);
                divFulfilled.append(container);
            }
        }
        fulfilledAccordion.accordion({
            active: '0',
            collapsible: true,
            header: "h3",
            heightStyle: "content"
        });
    }
    else
        fulfilledAccordion.css('display', 'none');
}

/* WORKFLOW */
var CreateReservation = function (dateTime, seats, name) {
    ReservationId = CreateNewRId(GetCurrentRId());
    var jsonDT = dateTime.toJSON();
    var reservation = { id: ReservationId, datetime: jsonDT, seats: Number(seats), name: name, seated: false }

    PostArrayData(ReservationKey, reservation);
    SelectedTimeFrame = $(":radio:checked");
    ListReservations(SelectedTimeFrame.val());
}

var CancelReservation = function (id) {    
    var allReservations = GetData(ReservationKey);

    for (var i = allReservations.length - 1; i >= 0; i--) {
        if (allReservations[i].id == id) {
            var cancelConfirmed = confirm("Cancel reservation for " + allReservations[i].name + "?");
            if (cancelConfirmed)
            {
                var _filteredAry = allReservations.splice(i, 1);
                PostData(ReservationKey, allReservations);
                SelectedTimeFrame = $(":radio:checked");
                ListReservations(SelectedTimeFrame.val());
            }               
            else
                return false;
        }
    }   
}

var DeleteReservation = function (id) {
    var allFulFillments = GetData(FulfilledKey);

    for (var i = allFulFillments.length - 1; i >= 0; i--) {
        if (allFulFillments[i].id == id) {
            var cancelConfirmed = confirm("Delete fulfilled reservation for " + allFulFillments[i].name + "?");
            if (cancelConfirmed) {
                var _filteredAry = allFulFillments.splice(i, 1);
                PostData(FulfilledKey, allFulFillments);
                ListFulfilled();
            }
            else
                return false;
        }
    }
}

var FillReservation = function (id) {
    var allReservations = GetData(ReservationKey);

    for (var i = allReservations.length - 1; i >= 0; i--) {
        if (allReservations[i].id == id) {
            var seatConfirm = confirm("Seat the party of " + allReservations[i].seats + "?");
            if (seatConfirm) {
                var _seatedDateTime = FormatNewDateYMDT();
                var _newFulFillment = allReservations[i];
                var _filteredAry = allReservations.splice(i, 1);

                _newFulFillment.datetime = (new Date(_seatedDateTime)).toJSON();
                _newFulFillment.seated = true;

                PostArrayData(FulfilledKey, _newFulFillment);
                PostData(ReservationKey, allReservations);
                
                SelectedTimeFrame = $(":radio:checked");

                ListReservations(SelectedTimeFrame.val());
                ListFulfilled();
            }
            else {
                var curCheckbox = $(":checkbox");
                curCheckbox.prop("checked", false);
            }
        }
    }
}

function ReservationHtml(id, datetime, name, number) {
    var container = $('<div/>', {
        "class": 'col-xs-12 text-center noPaddingMargins'
    });
   
    var cbCol = "<div class='col-xs-1 ui-state-default ui-corner-left minHeight30 removeRightBorder'><div class='margin0'><input onchange='FillReservation(" + id + ")' type='checkbox' class='form-control input-sm'></div></div>";
    var numberCol = "<div class='col-xs-1 ui-state-default removeRightBorder removeLeftBorder'><div class='margin5'><h4>" + number + "</h4></div></div>";
    var timeCol = "<div class='col-xs-4 ui-state-default removeRightBorder removeLeftBorder'><div class='margin5'><h4>" + datetime + "</h4></div></div>";
    var nameCol = "<div class='col-xs-4 ui-state-default removeRightBorder removeLeftBorder'><div class='margin5'><h4>" + name + "</h4></div></div>"; 
    var deleteCol = "<div class='col-xs-2 ui-state-default ui-corner-right minHeight30 removeLeftBorder text-left text-danger'><a class='btn' onclick='CancelReservation(" + id + ")'>Cancel</a></div>";

    container.append(cbCol);
    container.append(numberCol);
    container.append(timeCol);
    container.append(nameCol);
    container.append(deleteCol);

    return container;
}

function FulfilmentHtml(id, seated, datetime, name) {
    var container = $('<div/>', {
        "class": 'col-xs-12 text-center noPaddingMargins'
    });

    var cbCol = "<div class='col-xs-2 removeRightBorder'><div class='margin0'>" + seated + "</div></div>";
    var timeCol = "<div class='col-xs-4 removeRightBorder removeLeftBorder'><div>" + datetime + "</div></div>";
    var nameCol = "<div class='col-xs-5 removeRightBorder removeLeftBorder'><div>" + name + "</div></div>";
    var deleteCol = "<div class='col-xs-1 minHeight30 removeLeftBorder text-left text-danger'><a class='btn' onclick='DeleteReservation(" + id + ")'>Delete</a></div>";

    container.append(cbCol);
    container.append(timeCol);
    container.append(nameCol);
    container.append(deleteCol);

    return container;
}

/* LOCALSTORAGE OPERATIONS */
var PostData = function (key, Json){
    localStorage.setItem(key, JSON.stringify(Json));
    return key;
}

var PostArrayData = function (key, Json) {
    var currentReservations = JSON.parse(localStorage.getItem(key) || "[]");
    currentReservations.push(Json);
    localStorage.setItem(key, JSON.stringify(currentReservations));
    return key;
}

var GetData = function (key) {
    var retrievedData = localStorage.getItem(key);
    return JSON.parse(retrievedData);
}

var DeleteData = function (key) {
    localStorage.removeItem(key);
}

/* DATE UTILITIES */
var StartClock = function () {
    DateTime.text(FormatDateLong() + ' ' + FormatNewTime());
    var t = setTimeout(StartClock, 500);
}

var FormatNewTime = function () {
    // Returns: HH:MM
    return (new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
}

var FormatTime = function (date) {
    // Expected Format date: 2017-08-28T00:48:00.000Z
    var _date = date.split("-");
    var dateString = _date[1] + "/" + _date[2].substring(0,_date[2].indexOf('T')) + "/" + _date[0];

    dateString = (new Date(dateString)).toDateString();

    var timeString = Get12HourTime(date);

    timeString = timeString.startsWith("0") ? timeString.substring(1) : timeString;
    timeString = timeString.startsWith("0") ? "12" + timeString.substring(1) : timeString; 

    return GetSecondPartString(dateString) + ' ' + timeString
}

var FormatDateLong = function () {
    // Returns Format: 2017-08-28T00:48:00.000Z
    var dateString = (new Date()).toDateString();
    return GetSecondPartString(dateString);
}

var FormatNewDateYMDT = function () {
    // Return Format: MM/DD/YYYY
    var _date = new Date();
    var _dateString = (_date.getMonth() + 1) + '/' + _date.getDate() + '/' + _date.getFullYear();
    var _hours = _date.getHours().toString();
    var _minutes = _date.getMinutes().toString();
    _hours = PadSingleDigit(_hours);
    _minutes = PadSingleDigit(_minutes);
    var dateString = FormatDateYMDT(_dateString, _hours, _minutes, '');

    return dateString;
}

var FormatDateYMDT = function (date, hours, minutes, ap) {
    // Return Format: 2017-08-28T00:48:00.000Z
    if (!(date == undefined || date == null || date == NaN))
    {
        var resDate = date.split("/");
        var compDate = resDate[2] + '-' + PadSingleDigit(resDate[0]) + '-' + PadSingleDigit(resDate[1]);
        if (ap === "PM" && hours != 12)
            hours = Number(hours) + 12;
        var time = PadSingleDigit(hours) + ":" + PadSingleDigit(minutes);
        return compDate + 'T' + time + timePiece;
    }
}

function Get12HourTime(datetime) {
    // Expected Format datetime: 2017-08-28T00:48:00.000Z
    if (datetime == undefined || datetime == null || datetime == NaN)
        return "";
    var time = datetime.substring(datetime.indexOf('T'));
    var hours = time.substring(1, 3);
    var minutes = time.substring(3, 6);
    var suffix = " AM";

    if (hours > 12) {
        suffix = " PM";
        hours -= 12;
    }
    else if (hours == 12) {
        suffix = " PM";
        hours = 12;
    }
    hours += PadSingleDigit(minutes) + suffix;

    return hours;
}

var IsDateTimeValid = function (dateTime) {
    var matches = dateTime.match(dateIsValidReg);

    if (!matches === null) {
        // now lets check the date sanity
        var year = parseInt(matches[3], 10);
        var month = parseInt(matches[2], 10) - 1; // months are 0-11
        var day = parseInt(matches[1], 10);
        var hour = parseInt(matches[4], 10);
        var minute = parseInt(matches[5], 10);
        var second = parseInt(matches[6], 10);
        var date = new Date(year, month, day, hour, minute, second);
        if (date.getFullYear() !== year
            || date.getMonth() != month
            || date.getDate() !== day
            || date.getHours() !== hour
            || date.getMinutes() !== minute
            || date.getSeconds() !== second) {
            return false;
        }
        else {
            return true;
        }
    }

    return false;
}

/* UTILITIES */
var SortListDate = function (list) {
    var sortedReservations = [];
    for (var i = 0; list.length > i; i++) {
        var _item = list[i];
        sortedReservations.push([_item.datetime, _item.id]);
    }
    sortedReservations.sort();

    return sortedReservations;
}

var IsReservationValid = function () {
    var isValid = true;

    $(":text").removeClass("warning");

    $.each($(":text"), function () {
        if ($(this).val().length === 0) {
            $(this).addClass("warning");
            isValid = false;
        }
    });

    if (!isValid) return false;

    if (Hours.val().length === 0 || !numericReg.test(Hours.val()))
    {
        Hours.addClass('warning');
        isValid = false;
    }
    if (Minutes.val().length === 0 || !numericReg.test(Minutes.val())) {
        Minutes.addClass('warning');
        isValid = false;
    }
    if (AmPm.val().length === 0 || numericReg.test(AmPm.val())) {
        AmPm.addClass('warning');
        isValid = false;
    }
    if (Seats.val().length === 0 || !numericReg.test(Seats.val())) {
        Seats.addClass('warning');
        isValid = false;
    }
    return isValid;
}

var GetSecondPartString = function(value) {
    return value.match(/^(\S+)\s(.*)/).slice(2);
}

var PadSingleDigit = function (digit) {
    return digit.length == 1 ? "0" + digit : digit;
}

var OnlyNumbericCharacters = (function (inputVal) {
    return !numericReg.test(inputVal);
});

var NoSpecialCharacters = (function (inputVal) {
    return !characterReg.test(inputVal);
});

function FilterById(jsonObject, id) {
    return jsonObject.filter(function (jsonObject) {
        return (jsonObject['id'] == id);
    })[0];
}

/* Jquery & UI WIDGETS */
$('.change-stringlength').change(function () {
    var inputVal = $(this);
    inputVal.val().length === 0 ? inputVal.addClass('warning') : inputVal.removeClass('warning');
});

$('.keyup-stringlength').keyup(function () {
    var inputVal = $(this);
    inputVal.val().length === 0 ? inputVal.addClass('warning') : inputVal.removeClass('warning');
});

$('.keyup-characters').keyup(function () {
    var inputVal = $(this);
    inputVal.val().length === 0 || !characterReg.test(inputVal.val()) ? inputVal.addClass('warning') : inputVal.removeClass('warning');
});

$('.keyup-no-numeric').keyup(function () {
    var inputVal = $(this);
    inputVal.val().length === 0 || numericReg.test(inputVal.val()) ? inputVal.addClass('warning') : inputVal.removeClass('warning');
});

$('.keyup-numeric').keyup(function () {
    var inputVal = $(this);
    inputVal.val().length === 0 || !numericReg.test(inputVal.val()) ? inputVal.addClass('warning') : inputVal.removeClass('warning');
});

$.widget("ui.ampmspinner", $.ui.spinner, {
    widgetEventPrefix: "spin",
    options: {
        max: 1,
        min: 0,
        alignment: 'vertical'
    },
    _parse: function (value) {

        if (typeof value === "string") {
            return value == 'AM' ? 0 : 1;
        }
        return value;
    },
    _format: function (value) {
        return value === 0 ? 'AM' : 'PM';
    },

});

$.widget("ui.minutespinner", $.ui.spinner, {
    widgetEventPrefix: "spin",
    options: {
        max: 3,
        min: 0,
        alignment: 'vertical'
    },
    _parse: function (value) {

        if (typeof value === "string") {
            if (value == '00')
                return 0;
            if (value == '15')
                return 1;
            if (value == '30')
                return 2;
            if (value == '45')
                return 3;
        }
        return value;
    },
    _format: function (value) {
        if (value === 0)
            return '00';
        else if (value == 1)
            return '15';
        else if (value === 2)
            return '30';
        else if (value === 3)
            return '45';
        else
            return '00';
    },
});

/* VARIABLE DECLARATION */
var ReservationKey = "Reservations";
var FulfilledKey = "Fulfilled";
var ReservationIdKey = "RId";
var ReservationId = 0;

var noDataFound = "<div class='col-xs-12 text-center'><h4><a id='aNewReservation' onclick='NewReservation()'>Create New Reservation</a></h4></div>";
var headerSeated = "<div class='col-xs-2'><h5 class='boldText'>Seated</h5></div>";
var headerDate = "<div class='col-xs-4'><h5 class='boldText'>Date/time Seated</h5></div>";
var headerName = "<div class='col-xs-5'><h5 class='boldText'>Reservation Name</h5></div";
var headerEmpty = "<div class='col-xs-1'><h5 class='boldText'>&nbsp;</h5></div>";

var characterReg = /^\s*[a-zA-Z0-9,\s]+\s*$/;
var numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
var dateLongStringReg = /^(19|20)\d\d-(0[1-9]|1[012])-([012]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/; 
var dateIsValidReg = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
var timePiece = ':00.000Z';

/* jQuery Objects  */
var h4Seats = $("#h4Seats");
var DateTime = $("#DateTime");
var NewReservationBtn = $("#NewReservation");
var divReservations = $("#divReservations");
var divFulfilled = $("#divFulfilled");
var divReservation = $("#divReservation");
var Hours = $("#Hours");
var Minutes = $("#Minutes");
var AmPm = $("#AmPm");
var Name = $("#Name");
var Seats = $("#Seats");
var rDate = $("#Date");
var radioDay = $("#radioDay");
var radioWeek = $("#radioWeek");
var radioMonth = $("#radioMonth");
var DayWeekMonth = $(":radio");
var SelectedTimeFrame = $(":radio:checked");
var fulfilledAccordion = $("#fulfilledAccordion");
var ReservationHeader = $("#ReservationHeader");

