sap.ui.define([], function () {
			"use strict";

			return {

				/**
				 * Rounds the number unit value to 2 digits
				 * @public
				 * @param {string} sValue the number string to be rounded
				 * @returns {string} sValue with 2 digits rounded
				 */
				numberUnit: function (sValue) {
					if (!sValue) {
						return "";
					}
					return parseFloat(sValue).toFixed(2);
				},

				dayPlan: function (sValue) {
					if (sValue === "Error") {
						return Error;
					}
				},

				FormatDate: function (sDate) {
					if (sDate !== undefined && sDate !== null) {
						var onlyDate = sDate.split('T')[0];
						var splitDate = onlyDate.split('-');
						var date = splitDate[2].concat('/').concat(splitDate[1]).concat('/').concat(splitDate[0]);
						return date;
					}
				},

				formatLongDate: function (dateValue) {
					var response = "";
					var format = 'dd/MM/yyyy hh:MM:ss';
					var isYearFormat = '';
					if (dateValue !== "NA" && dateValue !== "/Date(0)/") {
						if (dateValue) {
							if (typeof (dateValue) === "string" && dateValue.indexOf("/Date") > -1) {
								dateValue = parseFloat(dateValue.substr(dateValue.lastIndexOf("(") + 1, dateValue.lastIndexOf(")") - 1));
							}
							dateValue = new Date(dateValue);
						} else {
							dateValue = new Date();
						}

						//Format Year										
						var yyyy = dateValue.getFullYear() + "";
						var tempDateStr = new Date().getFullYear();
						if (isYearFormat && (parseInt(yyyy) < tempDateStr)) {
							yyyy = tempDateStr.toString().substring(0, 2) + yyyy.substring(2, yyyy.length);
						}
						var mm = (dateValue.getMonth() + 1) + "";
						mm = (mm.length > 1) ? mm : "0" + mm;
						var dd = dateValue.getDate() + "";
						dd = (dd.length > 1) ? dd : "0" + dd;

						var hh, mins, secs;

						response = dd + "/" + mm + "/" + yyyy + " ";
						hh = dateValue.getHours() + "";
						hh = (hh.length > 1) ? hh : "0" + hh;
						mins = dateValue.getMinutes() + "";
						mins = (mins.length > 1) ? mins : "0" + mins;
						secs = dateValue.getSeconds() + "";
						secs = (secs.length > 1) ? secs : "0" + secs;
						response += hh + ":" + mins + ":" + secs;
						return response;
					//	break;

					}
				},
					onStatus: function (Status) {
							switch (Status) {
							case "01":
								return "Warning";
							case "02":
								return "Success";
							default:
								return "None";
							}
						},
						onStatusText: function (Status) {
							switch (Status) {
							case "DRAFT":
								return "Warning";
							case "SUBMITTED":
								return "Success";
							default:
								return "None";
							}
						},
						onJOBStatus: function (Status) {
							if (Status !== null) {
								switch (Status) {
								case "01":
									return "Warning";
								case "02":
								case "03":
									return "Success";
								default:
									return "None";
								}
							}

						},
						Date: function (sDate) {
							if (sDate !== undefined && sDate !== null) {
								return sDate.split("-")[2].split(" ")[0] + "/" + sDate.split("-")[1]; // + " " + sDate.split(".")[0].split(" ")[1];
							}
						},
						dateFormatDisplay: function (sDate) {
							if (sDate !== undefined && sDate !== null) {
								var arr = sDate.split('-');
								var month = arr[2].split(' ');
								var yearMonth = arr[0].concat('-').concat(arr[1]);
								var date = yearMonth.concat('-').concat(month[0]);
								return date;
							}
						},
						dateFormatDisplayDDmmYYYY: function (sDate) {
							if (sDate !== undefined && sDate !== null) {
								var arr = sDate.split('-');
								var month = arr[2].split(' ');
								var yearMonth = arr[1].concat('/').concat(arr[0]);
								var date = month[0].concat('/').concat(yearMonth);
								return date;
							}
						},

						formatDateAsString: function (dateValue, format, isYearFormat) {
							var response = "";
							
							if (dateValue !== "NA" && dateValue !== "/Date(0)/") {
								if (dateValue) {
									if (typeof (dateValue) === "string" && dateValue.indexOf("/Date") > -1) {
										dateValue = parseFloat(dateValue.substr(dateValue.lastIndexOf("(") + 1, dateValue.lastIndexOf(")") - 1));
									}
									dateValue = new Date(dateValue);
								} else {
									dateValue = new Date();
								}

								//Format Year										
								var yyyy = dateValue.getFullYear() + "";
								var tempDateStr = new Date().getFullYear();
								if (isYearFormat && (parseInt(yyyy) < tempDateStr)) {
									yyyy = tempDateStr.toString().substring(0, 2) + yyyy.substring(2, yyyy.length);
								}
								var mm = (dateValue.getMonth() + 1) + "";
								mm = (mm.length > 1) ? mm : "0" + mm;
								var dd = dateValue.getDate() + "";
								dd = (dd.length > 1) ? dd : "0" + dd;

								var hh, mins, secs;

								switch (format) {
								case "yyyyMMdd":
									response = yyyy + mm + dd;
									break;
								case "dd/MM/yyyy":
									response = dd + "/" + mm + "/" + yyyy;
									break;
								case "yyyy-MM-dd":
									response = yyyy + "-" + mm + "-" + dd;
									break;
								case "yyyy-dd-MM":
									response = yyyy + "-" + dd + "-" + mm;
									break;
								case "MM/dd/yyyy":
									response = mm + "/" + dd + "/" + yyyy;
									break;
								case "MM/yyyy":
									response = mm + "/" + yyyy;
									break;
								case "yyyy-MM-ddThh:MM:ss":
									hh = dateValue.getHours() + "";
									hh = (hh.length > 1) ? hh : "0" + hh;
									mins = dateValue.getMinutes() + "";
									mins = (mins.length > 1) ? mins : "0" + mins;
									secs = dateValue.getSeconds() + "";
									secs = (secs.length > 1) ? secs : "0" + secs;
									response = yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + mins + ":" + secs;
									break;
								case "hh:MM:ss":
									hh = dateValue.getHours() + "";
									hh = (hh.length > 1) ? hh : "0" + hh;
									mins = dateValue.getMinutes() + "";
									mins = (mins.length > 1) ? mins : "0" + mins;
									secs = dateValue.getSeconds() + "";
									secs = (secs.length > 1) ? secs : "0" + secs;
									response = hh + ":" + mins + ":" + secs;
									break;
								case "dd/MM/yyyy hh:MM:ss":
									response = dd + "/" + mm + "/" + yyyy + " ";
									hh = dateValue.getHours() + "";
									hh = (hh.length > 1) ? hh : "0" + hh;
									mins = dateValue.getMinutes() + "";
									mins = (mins.length > 1) ? mins : "0" + mins;
									secs = dateValue.getSeconds() + "";
									secs = (secs.length > 1) ? secs : "0" + secs;
									response += hh + ":" + mins + ":" + secs;
									break;
								case "yyyy-MM-dd hh:MM:ss":
									response = yyyy + "-" + mm + "-" + dd + " ";
									hh = dateValue.getHours() + "";
									hh = (hh.length > 1) ? hh : "0" + hh;
									mins = dateValue.getMinutes() + "";
									mins = (mins.length > 1) ? mins : "0" + mins;
									secs = dateValue.getSeconds() + "";
									secs = (secs.length > 1) ? secs : "0" + secs;
									response += hh + ":" + mins + ":" + secs;
									break;
								default:
									response = dateValue;
									break;
								}
							}
							return response;
						}

				};

			});