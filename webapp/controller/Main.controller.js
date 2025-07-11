sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/Dialog",
	"sap/m/library",
	"sap/m/Button",
	"sap/m/Text",
	"../model/formatter",
	"sap/ui/export/Spreadsheet",
	"sap/ui/export/library",
	"sap/m/List",
	"sap/m/StandardListItem",
	"../util/service"
], function (Controller, BusyIndicator, JSONModel, MessageToast, MessageBox, Dialog, mlibrary, Button, Text, formatter, Spreadsheet,
	exportLibrary, List, StandardListItem, ServiceHandler) {
	"use strict";
	var ButtonType = mlibrary.ButtonType;
	var DialogType = mlibrary.DialogType;
	var EdmType = exportLibrary.EdmType;
	return Controller.extend("rosterassignmentvk.rosterassignmentvk.controller.Main", {
		formatter: formatter,

		onInit: function () {
			var e = new sap.ui.model.json.JSONModel;
			var t, that = this;
			//e.loadData("/services/userapi/currentUser", null, false);
			e.loadData(sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/currentUser", null, false);
			sap.ui.getCore().setModel(e, "userapi");
			e.dataLoaded().then(function () {
				// t = sap.ui.getCore().getModel("userapi").getData().data[0].userDetail[0].USERID;
				t = sap.ui.getCore().getModel("userapi").getData().pUserId;
				// this.setLocation(sap.ui.getCore().getModel("userapi").getData().data[5].locations);
			}.bind(this));
			//	this.getCurrentUser();
			this.getRosterVH();
		},
		setLocation: function (odata) {
			var olocModel = new sap.ui.model.json.JSONModel();
			olocModel.setData(odata);
			this.getOwnerComponent().setModel(olocModel, "shipList");

		},
		/*		getCurrentUser: function () {
					var userModel = new sap.ui.model.json.JSONModel(),
						sUserID, that = this;
					userModel.loadData("/services/userapi/currentUser", null, false);
					sap.ui.getCore().setModel(userModel, "userapi");
					userModel.dataLoaded().then(function () {
						sUserID = sap.ui.getCore().getModel("userapi").getData().name;
						that._getUserDetails(sUserID);
					});
				},
				// fetch user details
				_getUserDetails: function (sUserID) {
					var oJsonModel = new sap.ui.model.json.JSONModel();
					oJsonModel.loadData("/IASUserScim/" + sUserID, null, false);
					sap.ui.getCore().setModel(oJsonModel, "userIAS");
					oJsonModel.dataLoaded().then(function (oData) {
						sap.ui.getCore().getModel("userapi").setProperty("/pID", sap.ui.getCore().getModel("userIAS").getProperty("/id"));
						var email = sap.ui.getCore().getModel("userIAS").getData().emails[0].value;
						sap.ui.getCore().getModel("userapi").setProperty("/Email", email);
					});
				},*/

		getRosterVH: async function () {
			this.sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/roster/rosterAssignment/handleRosterHeaderIdVH";
			var response = await ServiceHandler.get(this.sPath)
			if (response.status) {
				var oModel = new sap.ui.model.json.JSONModel(response.RosterDetail);
				this.getView().byId("rosterFilter").setModel(oModel, "RosterData");
			} else {
				MessageBox.error("Data loading failed..!!");
			}
		},

		onReset: function () {
			/*this.getView().byId("rosterFilter").setSelectedKeys('');
			this.getView().byId("PlanningShipsFilter").setSelectedKeys('');
			this.getView().byId("idStartDate").setValue('');*/
			this.getView().byId("rosterFilter").removeAllSelectedItems();
			this.getView().byId("PlanningShipsFilter").removeAllSelectedItems();
			this.getView().byId("idStartDate").setValue('');
		},

		onSearch: function () {
			var oTableUIData = this.getView().getModel("local").getProperty("/");
			var aRosterSelected = (oTableUIData.oSelectedRoster) ? oTableUIData.oSelectedRoster : [];
			var aShipSelected = (oTableUIData.oSelectedShip) ? oTableUIData.oSelectedShip : [];
			var oFromDate = this._convertToUTC(oTableUIData.oStartDate);
			var oEndDate = oTableUIData.oEndDate;
			var dates = this.getView().byId("idStartDate").getValue()
			if (dates) {
				var oStartFrom = dates.split('-')[0].replace(/\s/g, '').replace('/', '.').replace('/', '.');
				var oStartTo = dates.split('-')[1].replace(/\s/g, '').replace('/', '.').replace('/', '.');
			}
			if (oStartFrom === undefined) {
				oStartFrom = '';
			} else {
				oStartFrom = oStartFrom;
			}
			if (oStartTo === undefined) {
				oStartTo = '';
			} else {
				oStartTo = oStartTo;
			}
			/*		var datesTo = this.getView().byId("idEndDate").getValue()
					if (datesTo) {
						var oEndFrom = datesTo.split('-')[0].replace(/\s/g, '').replace('/','.').replace('/','.');
						var oEndTo = datesTo.split('-')[1].replace(/\s/g, '').replace('/','.').replace('/','.');
					}
	
					if (oEndFrom === undefined) {
						oEndFrom = '';
					} else {
						oEndFrom = oEndFrom;
					}
					if (oEndTo === undefined) {
						oEndTo = '';
					} else {
						oEndTo = oEndTo;
					}*/
			var Payload = {
				"ROSTER_CODE": aRosterSelected,
				"SHIP_CODE": aShipSelected,
				"START_DATE_FROM": oStartFrom,
				"START_DATE_TO": oStartTo
				/*	"END_DATE_FROM": oEndFrom,
					"END_DATE_TO": oEndTo*/
				// aShipSelected
				/*				"endDate": oEndDate,
								"locationId": aShipSelected,
								"jobTitles": aJobSelected,
								"function": aDivSelected,
								"userId": aEmpSelected,
								"countryOfCompany": aCountrySelected*/
			};
			this.getRosterAssignmentData(Payload);
		},

		_convertToUTC: function (o) {
			if (!o) {
				return o;
			}
			var _ = new Date(o.getTime());
			o.setMinutes(o.getMinutes() - o.getTimezoneOffset());
			return o;
		},

		getRosterAssignmentData: function (oPayload) {
			var that = this;
			that.dp = this.dp;
			BusyIndicator.show();
			var oHeader = this._fnHeaders(sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/rosterAssignment");
			var oJsonModel = new sap.ui.model.json.JSONModel();
			oJsonModel.loadData(sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/rosterAssignment?cmd=fetchRosterAssignments", JSON.stringify(oPayload),
				true,
				"POST", false, false, oHeader);
			oJsonModel.attachRequestCompleted(null, function (jsonData) {
				BusyIndicator.hide();
				if (oJsonModel.getData().data.status === "SUCCESS") {
					//	that.getView().getModel("local").setProperty("/range", true);
					//console.log(oJsonModel.getData());

					var oDataModel = that.getView().getModel("rosterAssignmentData");
					oDataModel.setData(oJsonModel.getData().data.results);
					that.getView().byId("rosterAssignmentDataTbl").removeSelections();
					/*	that.dp.startDate = that.summaryStart;
						that.dp.days = DayPilot.DateUtil.daysDiff(that.summaryStart.value, that.summaryEnd.value);
						that.dp.resources = oJsonModel.getData().results1;
						that.dp.events.list = oJsonModel.getData().results2;
						that.dp.visible = true;
						that.dp.update();*/
				} else {
					MessageToast.show("No Data");
					BusyIndicator.hide();
				}
			});
		},

		onCreateRosterAssignment: function (oEvent) {

			var oView = this.getView();
			this.inputIdCpaGrp = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialogCreate) {
				this._valueHelpDialogCreate = sap.ui.xmlfragment(this.createId("idUniqueFragRosterAssignment"),
					"rosterassignment.rosterassignment.view.fragment.createRosterAssignment",
					this
				);
				this.getView().addDependent(this._valueHelpDialogCreate);
			}
			this._valueHelpDialogCreate.open();
			this.getRosterVHFragment();
		},

		handleFgRosterAssignmentClose: function () {
			this._valueHelpDialogCreate.close();
		},
		getRosterVHFragment: function () {
			this.sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/rosterAssignment?cmd=handleRosterHeaderIdVH";
			var oJsonModel = new JSONModel();
			oJsonModel.loadData(this.sPath, {}, true, "GET", false, true, {
				"X-CSRF-Token": "Fetch"
			});

			oJsonModel.attachRequestCompleted(function (jsonData, response) {
				var oData = jsonData.getSource().getData();
				if (oData.data.status) {
					var oModel = new sap.ui.model.json.JSONModel(jsonData.getSource().getData().data.RosterDetail);
					sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseRosterCode").setModel(oModel,
						"RosterData");

				} else {
					sap.M.MessageBox.error("Data loading failed..!!");
				}
			}.bind(this));
		},
		handleFgRosterAssignmentClear: function () {
			var oCore = sap.ui.getCore();
			//	sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseRosterName").setValue("");
			sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseRosterCode").setSelectedKey("");
			sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseShip").setSelectedKey("");
			sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragStartDate").setValue("");
			sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragEndDate").setValue("");
		},
		handleFgRosterAssignmentSave: function (oEvent) {
			var oCore = sap.ui.getCore();
			//	var rosterName = sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseRosterName").getValue();
			var rosterCode = sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseRosterCode").getSelectedKey();
			var ship = sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseShip").getSelectedKey();
			var startDate = sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragStartDate").getValue();
			var EndDate = sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragEndDate").getValue();

			if (rosterCode === '' || ship === '' || startDate === '' || EndDate === '') {
				var msg = "Please enter all manditory fields";
				MessageToast.show(msg);
				return;
			} else if (!this.oCreateDialog) {
				this.oCreateDialog = new Dialog({
					type: DialogType.Message,
					title: "Confirm",
					content: new Text({
						text: "Are you sure you want to create roster assignment?"
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Submit",
						press: function () {
							this.CreateRosterAssignment();
							this.oCreateDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: "Cancel",
						press: function () {
							this.oCreateDialog.close();
						}.bind(this)
					})
				});
			}
			this.oCreateDialog.open();
		},

		CreateRosterAssignment: function (oEvent) {

			var item = [];

			var requestData = [{
				//		"ROSTER_NAME": sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseRosterName").getValue(),
				"ROSTER_CODE": sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseRosterCode").getSelectedKey(),
				"SHIP_CODE": sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseShip").getSelectedKey(),
				"START_DATE": sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragStartDate").getValue(),
				"END_DATE": sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragEndDate").getValue(),
				"ASSIGNMENT_STATUS": "No",
				"OPERATION_ID": "",
				"IS_DELETED": 'N',
				"MODIFIED_ON": this.formatDateAsString(new Date(), "yyyy-MM-ddThh:MM:ss"),
				"MODIFIED_BY": this._getCurrentUser().name
				//	"MODIFIED_BY": sap.ui.getCore().getModel("userapi").getProperty("/Email")
			}];

			this.createRecords(requestData);

		},
		createRecords: function (oPayload) {
			var that = this;
			that.dp = this.dp;
			BusyIndicator.show();
			var oHeader = this._fnHeaders(sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/rosterAssignment");
			var oJsonModel = new sap.ui.model.json.JSONModel();

			var sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/rosterAssignment?cmd=handlePostRosterAssignments";

			oJsonModel.loadData(sPath, JSON.stringify(oPayload), true,
				"POST", false, false, oHeader);
			oJsonModel.attachRequestCompleted(null, function (jsonData) {
				BusyIndicator.hide();
				if (oJsonModel.getData().data.status === 'SUCCESS') {
					//	that.getView().getModel("local").setProperty("/range", true);
					//	console.log(oJsonModel.getData());
					that.handleFgRosterAssignmentClear();

					MessageToast.show("Successfully Updated");
					that.handleFgRosterAssignmentClose();
					that.onSearch();
				} else {
					MessageToast.show(oJsonModel.getData().data.results[0].Message);
					BusyIndicator.hide();
				}
			});
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
					case "yyyy-MM-ddThh:MM:ss":
						hh = dateValue.getHours() + "";
						hh = (hh.length > 1) ? hh : "0" + hh;
						mins = dateValue.getMinutes() + "";
						mins = (mins.length > 1) ? mins : "0" + mins;
						secs = dateValue.getSeconds() + "";
						secs = (secs.length > 1) ? secs : "0" + secs;
						response = yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + mins + ":" + secs;
						break;
					case "yyyy-MM-dd":
						response = yyyy + "-" + mm + "-" + dd;
						break;
					default:
						response = dateValue;
						break;
				}
			}
			return response;
		},

		//fetch current user details
		_getCurrentUser: function () {
			var oCurrData = sap.ui.getCore().getModel("userapi").getData();
			// var sUserID = sap.ui.getCore().getModel("userapi").getProperty("/empNum");
			// oCurrData.name = (sUserID) ? sUserID : oCurrData.name;
			var sUserID = sap.ui.getCore().getModel("userapi").getData().data[0].userDetail[0].USERID;
			oCurrData.name = (sUserID) ? sUserID : oCurrData.data[0].userDetail[0].FIRSTNAME;
			if (!oCurrData.name) {
				oCurrData = {
					name: "Default_User",
					displayName: "Default_User"
				};
			}
			return oCurrData;
		},

		onUpdateAssignmentStatus: function (oEvent) {
			var keys = this.getView().byId("rosterAssignmentDataTbl").getSelectedItems();
			if (keys.length === 0) {
				var msg = "Please select atleast one row to change assignment status";
				MessageToast.show(msg);
				return;
			} else {
				var oView = this.getView();
				//	// create value help dialog
				if (!this._valueHelpDialogChangeAssiStatus) {
					this._valueHelpDialogChangeAssiStatus = sap.ui.xmlfragment(this.createId("idUniqueFragChangeAssiStatus"),
						"rosterassignment.rosterassignment.view.fragment.changeAssignmentStatus",
						this
					);
					this.getView().addDependent(this._valueHelpDialogChangeAssiStatus);
				}
				this._valueHelpDialogChangeAssiStatus.open();
			}
		},

		handleFgAssignmentStatusClose: function () {
			this._valueHelpDialogChangeAssiStatus.close();
		},

		handleFgAssignmentStatusSave: function () {
			var assignmentStatus = sap.ui.core.Fragment.byId(this.createId("idUniqueFragChangeAssiStatus"), "idFragChooseAssignmentStatus").getSelectedKey();
			if (assignmentStatus === '') {
				var msg = "Please select Assignment Status";
				MessageToast.show(msg);
				return;
			} else {
				var oTable = this.getView().byId("rosterAssignmentDataTbl");
				var keys = this.getView().byId("rosterAssignmentDataTbl").getSelectedItems();
				var requestData = [];

				for (var i = 0; i < keys.length; i++) {
					var obj = {
						"ASSIGNMENT_STATUS": assignmentStatus,
						"ROSTER_HEADER_ID": keys[i].mAggregations.cells[0].getText(),
						"SHIP_CODE": keys[i].mAggregations.cells[3].getText(),
						"START_DATE": this.formatdatePost(keys[i].mAggregations.cells[4].getText()),
						"END_DATE": this.formatdatePost(keys[i].mAggregations.cells[5].getText()),
						"MODIFIED_ON": this.formatDateAsString(new Date(), "yyyy-MM-ddThh:MM:ss"),
						"MODIFIED_BY": this._getCurrentUser().name
						//	"MODIFIED_BY": sap.ui.getCore().getModel("userapi").getProperty("/Email")
					};
					requestData.push(obj);
				}
				this.saveAssignmentStatus(requestData);
			}

		},

		saveAssignmentStatus: function (oPayload) {
			var that = this;
			that.dp = this.dp;
			BusyIndicator.show();
			var oHeader = this._fnHeaders(sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/rosterAssignment");
			var oJsonModel = new sap.ui.model.json.JSONModel();
			var sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvkt") + "/api/rosterAssignment?cmd=handleUpdateAssignmentStatus";

			oJsonModel.loadData(sPath, JSON.stringify(oPayload), true,
				"POST", false, false, oHeader);
			oJsonModel.attachRequestCompleted(null, function (jsonData) {
				BusyIndicator.hide();
				if (oJsonModel.getData().data.status === 'SUCCESS') {
					MessageToast.show("Assignment Status Changed Successfully");
					that.handleFgAssignmentStatusClose();
					that.onSearch();
				} else {
					MessageToast.show("Not able to change the Assignment Status");
					BusyIndicator.hide();
				}
			});

		},
		onDeleteRosterAssignment: function (oEvent) {
			var keys = this.getView().byId("rosterAssignmentDataTbl").getSelectedItems();
			if (keys.length === 0) {
				var msg = "Please select atleast one row to delete the assignment";
				MessageToast.show(msg);
				return;
			} else if (!this.oDeleteDialog) {
				this.oDeleteDialog = new Dialog({
					type: DialogType.Message,
					title: "Confirm",
					content: new Text({
						text: "Do you want delete selected records?"
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Submit",
						press: function () {
							this.deleteChanges();
							this.oDeleteDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: "Cancel",
						press: function () {
							this.oDeleteDialog.close();
						}.bind(this)
					})
				});
			}
			this.oDeleteDialog.open();

		},

		deleteChanges: function () {
			var oTable = this.getView().byId("rosterAssignmentDataTbl");
			var keys = this.getView().byId("rosterAssignmentDataTbl").getSelectedItems();
			var requestData = [];

			for (var i = 0; i < keys.length; i++) {
				var obj = {
					"ROSTER_HEADER_ID": keys[i].mAggregations.cells[0].getText(),
					"SHIP_CODE": keys[i].mAggregations.cells[3].getText(),
					"START_DATE": this.formatdatePost(keys[i].mAggregations.cells[4].getText()),
					"END_DATE": this.formatdatePost(keys[i].mAggregations.cells[5].getText()),
					"MODIFIED_ON": this.formatDateAsString(new Date(), "yyyy-MM-ddThh:MM:ss"),
					"MODIFIED_BY": this._getCurrentUser().name
					//	"MODIFIED_BY": sap.ui.getCore().getModel("userapi").getProperty("/Email")
				};
				requestData.push(obj);
			}
			/*	var requestData = {
					"reqPayload": item
				};*/

			this.deleteRecords(requestData);
		},

		formatdatePost: function (sDate) {
			var arr = sDate.split('/');
			var date = arr[2].concat('-').concat(arr[1]).concat('-').concat(arr[0]).concat('T00:00:00.000Z');
			return date;
		},

		deleteRecords: function (oPayload) {
			var that = this;
			that.dp = this.dp;
			BusyIndicator.show();
			var oHeader = this._fnHeaders(sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/rosterAssignment");
			var oJsonModel = new sap.ui.model.json.JSONModel();
			var sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/rosterAssignment?cmd=handleDeleteRosterAssignments";

			oJsonModel.loadData(sPath, JSON.stringify(oPayload), true,
				"POST", false, false, oHeader);
			oJsonModel.attachRequestCompleted(null, function (jsonData) {
				BusyIndicator.hide();
				if (oJsonModel.getData().data.status === 'SUCCESS') {
					MessageToast.show("Assignment deleted successfully");
					that.onSearch();
				} else {
					MessageToast.show("Not able to delete the records.");
					BusyIndicator.hide();
				}
			});

		},

		onDownloadRosterAssignmentTemplate: function () {

			var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
				pattern: "MM/dd/yyyy"
			}); //Returns a DateFormat instance for date
			var fileName = oDateFormat.format(new Date()).toString();
			//	var aData = this.getView().getModel("AbsenceTimesheet").getData();
			var item = [];
			//	aData = "";
			var aData = {
				ROSTER_NAME: "",
				ROSTER_CODE: "",
				SHIP_CODE: "",
				START_DATE: "",
				END_DATE: ""
			};
			item.push(aData);
			var aCols = this.createColumnConfig();

			var oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: item,
				fileName: "Template to upload mass roster assignments.xlsx"
			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					MessageToast.show('Data exported successfully..!!');
				})
				.finally(function () {
					oSheet.destroy();
				});
		},

		createColumnConfig: function () {
			return [{
				label: "Roster Name",
				type: EdmType.Text,
				property: ""
			}, {
				label: "Roster Code",
				type: EdmType.Text,
				property: ""
			}, {
				label: "Store",
				type: EdmType.Text,
				property: ""
			}, {
				label: "Start Date",
				type: EdmType.Date,
				inputFormat: 'yyyy-MM-dd',
				property: ""
			}, {
				label: "End Date",
				type: EdmType.Date,
				inputFormat: 'yyyy-MM-dd',
				property: ""
			}];
		},
		onUploadMassRosterAssignment: function (oEvent) {
			this.importFile(oEvent.getParameter("files") && oEvent.getParameter("files")[0]);
		},

		importFile: function (file) {
			var that = this;
			var excelData = {};
			var processedData = [];
			if (file && window.FileReader) {
				var reader = new FileReader();
				reader.onload = function (e) {
					var data = e.target.result;
					var workbook = XLSX.read(data, {
						type: 'binary'
					});
					workbook.SheetNames.forEach(function (sheetName) {
						// Here is your object for every sheet in workbook
						excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
						var data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
							header: 1
						});
						var columnNames = data[0];

						for (var i = 1; i < data.length; i++) {
							var rowData = data[i];
							var obj = {};
							for (var j = 0; j < rowData.length; j++) {
								//	obj[columnNames[j]] = rowData[j];
								switch (j) {
									case 0:
										obj.ROSTER_NAME = rowData[j];
										break;
									case 1:
										obj.ROSTER_CODE = rowData[j];
										break;
									case 2:
										obj.SHIP_CODE = rowData[j];
										break;

									case 3:
										obj.START_DATE = rowData[j];
										break;
									case 4:
										obj.END_DATE = rowData[j];
										break;
								}

							}
							processedData.push(obj);
						}

						//	var oModel = new sap.ui.model.json.JSONModel(processedData);
						//	this.getView().setModel(oModel);
					});
					var item = [];
					for (var i = 0; i < processedData.length; i++) {
						/*			if (excelData[i].ROSTER_NAME === "" || excelData[i].ROSTER_NAME === undefined) {
										concat("Please enter roster name at row no : ", i)
										MessageToast.show("Please enter roster name at row no : ");
										return;
									}
									if (excelData[i].Roster_Code === "" || excelData[i].Roster_Code === undefined) {
										MessageToast.show("Please enter roster code at row no : ");
										return;
									}
									if (excelData[i].SHIP === "" || excelData[i].SHIP === undefined) {
										MessageToast.show("Please enter ship at row no : ");
										return;
									}*/
						/*			if (processedData[i].START_DATE === "" || processedData[i].START_DATE === undefined) {
										MessageToast.show("Please enter effective start date at row no : ");
										return;
									}*/
						/*	if (excelData[i].EFFECTIVE_END_DATE === "" || excelData[i].EFFECTIVE_END_DATE === undefined) {
								MessageToast.show("Please enter effective end date at row no : ");
								return;
							}*/
						var requestData = {
							//		"ROSTER_NAME": sap.ui.core.Fragment.byId(this.createId("idUniqueFragRosterAssignment"), "idFragChooseRosterName").getValue(),
							"ROSTER_NAME": processedData[i].ROSTER_NAME,
							"ROSTER_CODE": processedData[i].ROSTER_CODE,
							"SHIP_CODE": processedData[i].SHIP_CODE,
							/*"START_DATE": that.dateConvert(processedData[i].START_DATE),
							"END_DATE": that.dateConvert(processedData[i].END_DATE),*/
							"START_DATE": that.excelDateConvert(processedData[i].START_DATE),
							"END_DATE": that.excelDateConvert(processedData[i].END_DATE),
							"ASSIGNMENT_STATUS": "No",
							"OPERATION_ID": "",
							"IS_DELETED": 'N',
							"MODIFIED_ON": that.formatDateAsString(new Date(), "yyyy-MM-ddThh:MM:ss"),
							"MODIFIED_BY": that._getCurrentUser().name
							//	"MODIFIED_BY": sap.ui.getCore().getModel("userapi").getProperty("/Email")
						};

						/*	var aData = {
								ROSTER_NAME: processedData[i].ROSTER_NAME,
								ROSTER_CODE: processedData[i].ROSTER_CODE,
								SHIP_CODE: excelData[i].SHIP,
								START_DATE: that.dateConvert(excelData[i].EFFECTIVE_START_DATE),
								END_DATE: that.dateConvert(excelData[i].EFFECTIVE_END_DATE)
							};*/
						item.push(requestData);

					}

					if (item.length > 0) {
						that.createMassRosterAssignments(item);
					}
				}

				//	var oDataModel = that.getView().getModel("AbsenceTimesheet");
				//	oDataModel.setData(excelData);

				//	that.localModel.refresh(true);
			};
			reader.onerror = function (ex) {
				console.log(ex);
			};
			reader.readAsBinaryString(file);
		},

		excelDateConvert: function (excelDate) {
			if (excelDate) {
				if (excelDate != "" || excelDate != undefined) {
					var dateComponents = excelDate.split("/");
					var year = parseInt(dateComponents[2]) + 2000;
					var day = parseInt(dateComponents[1]);
					var month = parseInt(dateComponents[0]) - 1;
					var date = new Date(year, month, day);
					var options = {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric'
					};
					var formattedDate = date.toLocaleDateString('en-GB', options);
					var dateSplit = formattedDate.split('/');
					var finalDate = dateSplit[2].concat('-', dateSplit[1]).concat('-', dateSplit[0]);
					return finalDate;
				}
			}
		},

		dateConvert: function (date) {
			if (date) {
				if (date != "" || date != undefined) {
					var dateSplit = date.split('/');
					var finalDate = dateSplit[2].concat('-', dateSplit[1]).concat('-', dateSplit[0]);
					return finalDate;
				}
			}
		},

		createMassRosterAssignments: function (data) {
			/*		var item = [];
					for (var i = 0; i < data.length; i++) {
						var reqPayload = {
							"ROSTER_NAME": data[i].ROSTER_NAME,
							"ROSTER_CODE": data[i].ROSTER_CODE,
							"SHIP": data[i].SHIP,
							"EFFECTIVE_START_DATE": data[i].EFFECTIVE_START_DATE,
							"EFFECTIVE_END_DATE": data[i].EFFECTIVE_END_DATE,
							"ASSIGNMENT_STATUS": "No",
							"ASSIGNMENT_ON": this.formatDateAsString(new Date(), "yyyy-MM-ddThh:MM:ss"),
							"ASSIGNMENT_BY": this._getCurrentUser().name
						};
						item.push(reqPayload);
					}
					var completeDataObj = {
						"reqPayload": item

					};*/

			this.createBulkAssignments(data);
		},

		createBulkAssignments: function (oPayload) {

			var that = this;
			that.dp = this.dp;
			BusyIndicator.show();
			var oHeader = this._fnHeaders(sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/rosterAssignment");
			var oJsonModel = new sap.ui.model.json.JSONModel();

			/*		var sPath = "";
					if (this.action === 'Absence') {*/
			var sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/rosterAssignment?cmd=handlePostRosterAssignments";
			/*		} else if (this.action === 'Timesheet') {
						sPath = "/Manning/viking/scheduling/tools/integration/AuditReport/TimesheetCorrection.xsjs";
					}*/

			oJsonModel.loadData(sPath, JSON.stringify(oPayload), true,
				"POST", false, false, oHeader);
			oJsonModel.attachRequestCompleted(null, function (jsonData) {
				BusyIndicator.hide();
				if (oJsonModel.getData().data.status === 'SUCCESS') {
					//	that.getView().getModel("local").setProperty("/range", true);
					//	console.log(oJsonModel.getData());

					MessageToast.show("Successfully Updated");

					that.onSearch();
				} else {
					that.showErrorMessages(oJsonModel.getData().data.results);
					//MessageToast.show("Not able to update the records.");
					BusyIndicator.hide();
				}
			});
		},

		showErrorMessages: function (data) {
			var oView = this.getView();
			var oModel = new sap.ui.model.json.JSONModel(data);
			// create value help dialog
			if (!this._valueHelpDialogErrors) {
				this._valueHelpDialogErrors = sap.ui.xmlfragment(this.createId("idUniqueFragErrors"),
					"rosterassignment.rosterassignment.view.fragment.errorMessages",
					this
				);
				this.getView().addDependent(this._valueHelpDialogErrors);
			}
			this._valueHelpDialogErrors.open();
			var oCore = sap.ui.getCore();

			var oErrors = sap.ui.core.Fragment.byId(this.createId("idUniqueFragErrors"), "idTblErrors");
			oErrors.setModel(oModel, "jsonValidationErrors");
		},

		handleFgErrorsClose: function () {
			this._valueHelpDialogErrors.close();
		},
		onExportExcel: function () {
			var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
				pattern: "MM/dd/yyyy"
			}); //Returns a DateFormat instance for date
			var fileName = oDateFormat.format(new Date()).toString();
			var aData = this.getView().getModel("rosterAssignmentData").getData();

			//	var aCols = this.createColumnConfig();
			var bData = [''];
			bData = aData;
			var aCols = this.createColumnConfigDownload();
			for (var i = 0; i < bData.length; i++) {
				if (bData[i].START_DATE !== null || bData[i].START_DATE !== undefined || bData[i].START_DATE !== '') {
					bData[i].START_DATE = this.FormatDate(bData[i].START_DATE);
				}
				if (bData[i].END_DATE !== null || bData[i].END_DATE !== undefined || bData[i].END_DATE !== '') {
					bData[i].END_DATE = this.FormatDate(bData[i].END_DATE);
				}
				if (bData[i].MODIFIED_ON !== null || bData[i].MODIFIED_ON !== undefined || bData[i].MODIFIED_ON !== '') {
					bData[i].MODIFIED_ON = this.formatLongDate(bData[i].MODIFIED_ON);
				}
			}

			var oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: bData,
				fileName: "List of roster assignments.xlsx"
			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					MessageToast.show('Data exported successfully..!!');
				})
				.finally(function () {
					oSheet.destroy();
				});
		},
		dateFormatDisplayLong: function (dateValue) {
			var date;
			if (dateValue) {
				date = dateValue.substring(0, 10);

			}
			return date;
		},
		createColumnConfigDownload: function () {
			return [{
				label: "Roster Name",
				property: "ROSTER_NAME"
			}, {
				label: "Roster Code",
				property: "ROSTER_CODE"
			}, {
				label: "Store",
				property: "SHIP_CODE"
			}, {
				label: "Start Date",
				property: "START_DATE"
			}, {
				label: "End Date",
				property: "END_DATE"
			}, {
				label: "Assignment Status",
				property: "ASSIGNMENT_STATUS"
			}, {
				label: "Modified On",
				property: "MODIFIED_ON"
			}, {
				label: "Modified By",
				property: "MODIFIED_BY"
			}];
		},

		_fnHeaders: function (oPath) {
			var oHeader = {
				"Content-Type": "application/json; charset=utf-8",
				"X-Content-Type-Options": "nosniff",
				"X-Frame-Options": "SAMEORIGIN",
				"X-XSS-Protection": "0; mode=block",
				"X-CSRF-Token": this.fetchTokenForSubmit(oPath)
			};
			return oHeader;
		},
		fetchTokenForSubmit: function (requestUrl) {
			var token = "";
			$.ajax({
				type: "GET",
				url: requestUrl,
				async: false,
				beforeSend: function (requestGET) {
					requestGET.setRequestHeader("X-CSRF-Token", "Fetch");
				},
				success: function (data, textStatus, requestGET) {
					token = requestGET.getResponseHeader("X-CSRF-Token");
				},
				error: function (requestGET) {
					token = requestGET.getResponseHeader("X-CSRF-Token");
				}
			});
			return token;
		},
		_convertToUTC: function (o) {
			if (!o) {
				return o;
			}
			var _ = new Date(o.getTime());
			o.setMinutes(o.getMinutes() - o.getTimezoneOffset());
			return o;
		},

	});
});