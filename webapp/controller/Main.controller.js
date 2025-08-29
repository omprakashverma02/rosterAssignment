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
	"../util/service",

], function (Controller, BusyIndicator, JSONModel, MessageToast, MessageBox, Dialog, mlibrary, Button, Text, formatter, Spreadsheet,
	exportLibrary, List, StandardListItem, ServiceHandler) {
	"use strict";
	var ButtonType = mlibrary.ButtonType;
	var DialogType = mlibrary.DialogType;
	var EdmType = exportLibrary.EdmType;
	return Controller.extend("rosterassignmentvk.rosterassignmentvk.controller.Main", {
		formatter: formatter,

		onInit: function () {
			// LOCAL MODEL
			var oLocalModel = new sap.ui.model.json.JSONModel({
				oSelectedRoster: [],
				oSelectedShip: [],
				oStartDate: "",
				oEndDate: ""
			});

			// attach to the Component (so you can use getOwnerComponent().getModel("local"))
			this.getOwnerComponent().setModel(oLocalModel, "local");

			// ROSTER ASSIGNMENT MODEL
			var oDataModel = new sap.ui.model.json.JSONModel([]);
			this.getView().setModel(oDataModel, "rosterAssignmentData");







			var e = new sap.ui.model.json.JSONModel;
			var t, that = this;
			e.loadData(sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/currentUser", null, false);
			sap.ui.getCore().setModel(e, "userapi");
			e.dataLoaded().then(function () {
				t = sap.ui.getCore().getModel("userapi").getData().pUserId;
			}.bind(this));
			this.getRosterVH();
			this.getShipVH()
		},
		setLocation: function (odata) {
			var olocModel = new sap.ui.model.json.JSONModel();
			olocModel.setData(odata);
			this.getOwnerComponent().setModel(olocModel, "shipList");

		},

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

		getShipVH: async function () {
			try {
				this.sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/vpp/distShips";
				var response = await ServiceHandler.get(this.sPath);

				if (response && response.status) {
					var aShips = response.data.results || response.data || [];
					var oModel = new sap.ui.model.json.JSONModel(aShips);
					this.getView().setModel(oModel, "shipList");
				} else {
					MessageBox.error("Data loading failed..!!");
				}
			} catch (err) {
				console.error("getShipVH error:", err);
				MessageBox.error("Unexpected error occurred while loading ships");
			}
		},

		onReset: function () {

			this.getView().byId("rosterFilter").removeAllSelectedItems();
			this.getView().byId("PlanningShipsFilter").removeAllSelectedItems();
			this.getView().byId("idStartDate").setValue('');
		},

		onSearch: function () {
			var oTableUIData = this.getOwnerComponent().getModel("local").getProperty("/") || {};
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

			var Payload = {
				"ROSTER_CODE": aRosterSelected,
				"SHIP_CODE": aShipSelected,
				"START_DATE_FROM": oStartFrom,
				"START_DATE_TO": oStartTo

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
			BusyIndicator.show(1);

			var sUrl = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") + "/api/roster/rosterAssignment/fetchRosterAssignments";

			var oJsonModel = new sap.ui.model.json.JSONModel();

			oJsonModel.loadData(
				sUrl,
				JSON.stringify(oPayload),
				true,   // async
				"POST", // method
				false,  // cache
				false,   // merge
				{ "Content-Type": "application/json" }
			)
			oJsonModel.attachRequestCompleted(function () {
				BusyIndicator.hide();

				var oResponse = oJsonModel.getData();
				if (oResponse && oResponse.status === 200 && oResponse.message === "SUCCESS") {
					var oDataModel = that.getView().getModel("rosterAssignmentData");
					oDataModel.setData(oResponse.results || []);
					that.getView().byId("rosterAssignmentDataTbl").removeSelections();
				} else {
					MessageToast.show("No Data");
				}
			});

			oJsonModel.attachRequestFailed(function () {
				BusyIndicator.hide();
				MessageToast.show("Error fetching roster assignments");
			});
		},

		onCreateRosterAssignment: function (oEvent) {

			var oView = this.getView();
			this.inputIdCpaGrp = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialogCreate) {
				this._valueHelpDialogCreate = sap.ui.xmlfragment(this.createId("idUniqueFragRosterAssignment"),
					"rosterassignmentvk.rosterassignmentvk.view.fragment.createRosterAssignment",
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
			this.sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") +
				"/api/roster/rosterAssignment/handleRosterHeaderIdVH";

			var oJsonModel = new sap.ui.model.json.JSONModel();
			oJsonModel.loadData(this.sPath, {}, true, "GET", false, true, {
				"X-CSRF-Token": "Fetch"
			});

			oJsonModel.attachRequestCompleted(function (jsonData, response) {
				var oData = jsonData.getSource().getData();

				if (oData && oData.status === 200) {
					var oModel = new sap.ui.model.json.JSONModel(oData.RosterDetail);
					sap.ui.core.Fragment.byId(
						this.createId("idUniqueFragRosterAssignment"),
						"idFragChooseRosterCode"
					).setModel(oModel, "RosterData");

				} else {
					// Show backend message if available, else default error
					var sErrorMsg = (oData && oData.message) ? oData.message : "Data loading failed..!!";
					sap.m.MessageBox.error(sErrorMsg);
				}
			}.bind(this));

			oJsonModel.attachRequestFailed(function () {
				sap.m.MessageBox.error("Service call failed. Please try again.");
			});
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
			BusyIndicator.show(5);

			var sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") +
				"/api/roster/rosterAssignment/handlePostRosterAssignments";

			var oJsonModel = new sap.ui.model.json.JSONModel();

			oJsonModel.loadData(
				sPath,
				JSON.stringify(oPayload),
				true,   // async
				"POST", // method
				false,  // cache
				false,   // merge
				{ "Content-Type": "application/json" }
			);

			oJsonModel.attachRequestCompleted(function () {
				BusyIndicator.hide();

				var oResponse = oJsonModel.getData();

				if (oResponse.status === 201) {
					that.handleFgRosterAssignmentClear();
					MessageToast.show("Successfully Updated");
					that.handleFgRosterAssignmentClose();
					that.onSearch();
				} else {
					var sMsg = (oResponse && oResponse.data && oResponse.data.results && oResponse.data.results[0])
						? oResponse.data.results[0].Message
						: "Update failed!";
					MessageToast.show(sMsg);
				}
			});

			oJsonModel.attachRequestFailed(function () {
				BusyIndicator.hide();
				MessageToast.show("Service call failed. Please try again.");
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

		_getCurrentUser: function () {
			var oCurrData = sap.ui.getCore().getModel("userapi").getData();

			// Prefer pUserId, fallback to fullName, then default
			var sUserID = oCurrData.pUserId || oCurrData.fullName;

			if (sUserID) {
				oCurrData.name = sUserID;
			} else {
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
						"rosterassignmentvk.rosterassignmentvk.view.fragment.changeAssignmentStatus",
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
			BusyIndicator.show(2);

			var oJsonModel = new sap.ui.model.json.JSONModel();
			var sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") +
				"/api/roster/rosterAssignment/handleUpdateAssignmentStatus";

			// Add Content-Type so backend parses JSON
			oJsonModel.loadData(
				sPath,
				JSON.stringify(oPayload),
				true,        // async
				"PUT",       // method
				false,       // cache
				false,       // crossDomain
				{ "Content-Type": "application/json" }
			);

			oJsonModel.attachRequestCompleted(null, function () {
				BusyIndicator.hide();

				var oResponse = oJsonModel.getData();
				if (oResponse && oResponse.status === 200) {
					MessageToast.show(oResponse.message || "Assignment Status Changed Successfully");
					that.handleFgAssignmentStatusClose();
					that.onSearch();
				} else {
					MessageToast.show("Not able to change the Assignment Status");
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
				};
				requestData.push(obj);
			}
			this.deleteRecords(requestData);
		},

		formatdatePost: function (sDate) {
			var arr = sDate.split('/');
			var date = arr[2].concat('-').concat(arr[1]).concat('-').concat(arr[0]).concat('T00:00:00.000Z');
			return date;
		},

		deleteRecords: function (oPayload) {
			var that = this;
			BusyIndicator.show(2);

			var sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") +
				"/api/roster/rosterAssignment/handleDeleteRosterAssignments";

			var oJsonModel = new sap.ui.model.json.JSONModel();

			oJsonModel.loadData(
				sPath,
				JSON.stringify(oPayload),   // request body
				true,                       // async
				"PUT",                      // method
				false,                      // cache
				false,                      // crossDomain
				{ "Content-Type": "application/json" }  // 🔹 ensure backend parses JSON
			);

			oJsonModel.attachRequestCompleted(function () {
				BusyIndicator.hide();

				var oResponse = oJsonModel.getData();
				if (oResponse && oResponse.status === 200) {
					MessageToast.show(oResponse.message || "Assignment deleted successfully");
					that.onSearch(); // refresh the table after delete
				} else {
					MessageToast.show("Not able to delete the records.");
				}
			});

			oJsonModel.attachRequestFailed(function (oError) {
				BusyIndicator.hide();
				MessageToast.show("Error deleting the records. Check console.");
				console.error("Delete failed:", oError);
			});
		},


		onDownloadRosterAssignmentTemplate: function () {

			var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
				pattern: "MM/dd/yyyy"
			}); //Returns a DateFormat instance for date
			var fileName = oDateFormat.format(new Date()).toString();
			var item = [];
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
					});
					var item = [];
					for (var i = 0; i < processedData.length; i++) {
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
			if (!excelDate) {
				return null;
			}

			// Case 1: If excelDate is a number (Excel serial date)
			if (typeof excelDate === "number") {
				// Excel's base date = 1900-01-01
				var date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
				// Format to YYYY-MM-DD
				return date.toISOString().split("T")[0];
			}

			// Case 2: If excelDate is a string (e.g., "09/01/25")
			if (typeof excelDate === "string") {
				var dateComponents = excelDate.split("/");
				if (dateComponents.length === 3) {
					var year = parseInt(dateComponents[2], 10);
					// Handle 2-digit year → add 2000
					if (year < 100) {
						year += 2000;
					}
					var day = parseInt(dateComponents[1], 10);
					var month = parseInt(dateComponents[0], 10) - 1;
					var date = new Date(year, month, day);
					return date.toISOString().split("T")[0]; // YYYY-MM-DD
				}
			}

			return null;
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
			this.createBulkAssignments(data);
		},

		createBulkAssignments: function (oPayload) {
			var that = this;
			BusyIndicator.show(2);

			var sPath = sap.ui.require.toUrl("rosterassignmentvk/rosterassignmentvk") +
				"/api/roster/rosterAssignment/handlePostRosterAssignments";

			var oJsonModel = new sap.ui.model.json.JSONModel();

			oJsonModel.loadData(
				sPath,
				JSON.stringify(oPayload),
				true,   // async
				"POST", // method
				false,  // cache
				false,  // merge
				{ "Content-Type": "application/json" }
			);

			oJsonModel.attachRequestCompleted(function () {
				BusyIndicator.hide();

				var oResponse = oJsonModel.getData();

				// Handle both formats
				var status = oResponse?.data?.status || oResponse?.status;
				var results = oResponse?.data?.results || oResponse?.results || [];

				if (status === "SUCCESS" || status === 201) {
					MessageToast.show("Successfully Updated");
					that.onSearch();
				} else {
					if (results.length > 0) {
						that.showErrorMessages(results);
					} else {
						MessageToast.show("Not able to update the records.");
					}
				}
			});

			oJsonModel.attachRequestFailed(function () {
				BusyIndicator.hide();
				MessageToast.show("Service call failed. Please try again.");
			});
		},
		showErrorMessages: function (data) {
			var oView = this.getView();
			var oModel = new sap.ui.model.json.JSONModel(data);
			// create value help dialog
			if (!this._valueHelpDialogErrors) {
				this._valueHelpDialogErrors = sap.ui.xmlfragment(this.createId("idUniqueFragErrors"),
					"rosterassignmentvk.rosterassignmentvk.view.fragment.errorMessages",
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