var Cesium = require('cesium/Cesium');
require('cesium/Widgets/widgets.css');

require('bootstrap');
require('bootstrap/dist/css/bootstrap.min.css');

var moment = require('moment');

require('jquery-ui/themes/base/core.css');
require('jquery-ui/themes/base/resizable.css');
require('jquery-ui/themes/base/theme.css');
var resizable = require("jquery-ui/ui/widgets/resizable");

require('tempusdominus-bootstrap-4');
require('tempusdominus-bootstrap-4/build/css/tempusdominus-bootstrap-4.min.css');

require('@fortawesome/fontawesome-free/css/all.css');

$(document).ready(function() {
  $("#cesiumContainer").resizable({
    handles: "s"
  });
  // initialize form fields
  $("#spacecraftList").append(
    $("<option></option>").data("tle", [
        "1 43013U 17073A   20064.75651873 -.00000019  00000-0  12051-4 0  9997",
        "2 43013  98.7478   4.2827 0000700  77.0188 283.1066 14.19541081118805"
    ].join("\n")).data("color", "#ff0000").text("NOAA-20")
  );
  $("#spacecraftList").append(
    $("<option></option>").data("tle", [
        "1 37849U 11061A   20064.73796659  .00000010  00000-0  25447-4 0  9991",
        "2 37849  98.7278   4.1156 0001040 104.8738 343.3085 14.19544838432762"
    ].join("\n")).data("color", "#00ff00").text("Suomi NPP")
  );
  $("#spacecraftList").append(
    $("<option></option>").data("tle", [
        "1 41866U 16071A   20064.58313066 -.00000252  00000-0  00000+0 0  9993",
        "2 41866   0.0348  74.9209 0000824 300.0053 282.5862  1.00269218 12081"
    ].join("\n")).data("color", "#0000ff").text("GOES-16")
  );
  $("#spacecraftList").append(
    $("<option></option>").data("tle", [
        "1 43613U 18070A   20064.66090471  .00000447  00000-0  16013-4 0  9998",
        "2 43613  91.9998  33.1465 0003084  79.6481 280.5116 15.28280952 81886"
    ].join("\n")).data("color", "#ffff00").text("ICESat-2")
  );
  $("#orbitDate").datetimepicker({
    timeZone: "UTC"
  });

  var initEpoch = moment.utc("2020-03-05T12:00:00.0Z");
  var initDuration = 0.5;

  $("#startDate").datetimepicker({
    date: initEpoch.clone(),
    timeZone: "UTC"
  });
  $("#duration").val(initDuration);
  $("#seed").val(0);
  $("#timeStep").val(600);
  $("#animationStart").datetimepicker({
    date: initEpoch.clone(),
    timeZone: "UTC"
  });
  $("#animationEnd").datetimepicker({
    date: initEpoch.clone().add(initDuration, 'days'),
    timeZone: "UTC"
  });
  $("#trailTime").val(6);

  function updateAnimationDate() {
      var startDate = moment($("#startDate").datetimepicker("date"));
      var duration = parseFloat($("#duration").val());
      var endDate = startDate.clone().add(duration, 'days');
      $("#animationStart").datetimepicker("date", startDate);
      $("#animationEnd").datetimepicker("date", endDate);
  }
  $("#startDate").on("change.datetimepicker", updateAnimationDate);
  $("#duration").change(updateAnimationDate);

  function setUpOrbitPanel(orbit) {
      if(orbit.hasOwnProperty("date")) {
        $("#orbitDate").datetimepicker("date", moment.utc(orbit["date"]));
      } else {
        $("#orbitDate").datetimepicker("date", null);
      }
      $("#orbitAltitude").val(orbit["altitude"]/1e3);
      $("#orbitInclination").val(orbit["inclination"]);
      $("#orbitEccentricity").val(orbit["eccentricity"]);
      $("#orbitPerigeeArgument").val(orbit["perigeeArgument"]);
      $("#orbitRightAscensionOfAscendingNode").val(orbit["rightAscensionOfAscendingNode"]);
      $("#orbitTrueAnomaly").val(orbit["trueAnomaly"]);
      $("#orbitHarmonics").prop("checked", orbit.hasOwnProperty("harmonics"));
      if(orbit.hasOwnProperty("harmonics")) {
        $("#orbitHarmonicsDegree").val(orbit["harmonics"].hasOwnProperty("degree") ? orbit["harmonics"]["degree"] : "");
        $("#orbitHarmonicsOrder").val(orbit["harmonics"].hasOwnProperty("order") ? orbit["harmonics"]["order"] : "");
      }
  }

  // set up event handlers
  $("#spacecraftList").change(function() {
    $("#spacecraftLabel").val($(this).find(":selected").text());
    $("#spacecraftColor").val($(this).find(":selected").data("color"));
    if($(this).find(":selected").data("tle")) {
      $("#spacecraftTLE").val($(this).find(":selected").data("tle"));
      $("#nav-tle-tab").removeClass("disabled");
      $("#nav-tle-tab").tab("show");
      $("#nav-keplerian-tab").addClass("disabled");
    } else if($(this).find(":selected").data("orbit")) {
      setUpOrbitPanel($(this).find(":selected").data("orbit"));
      $("#nav-keplerian-tab").removeClass("disabled");
      $("#nav-keplerian-tab").tab("show");
      $("#nav-tle-tab").addClass("disabled");
    } else {
      $("#spacecraftTLE").val("");
      $("#orbitDate").datetimepicker("date", null);
      $("#orbitAltitude").val("");
      $("#orbitInclination").val("");
      $("#orbitEccentricity").val("");
      $("#orbitPerigeeArgument").val("");
      $("#orbitRightAscensionOfAscendingNode").val("");
      $("#orbitTrueAnomaly").val("");
      $("#orbitHarmonics").prop("checked", false);
      $("#spacecraftList option:selected").data("orbit", null);
      $("#nav-keplerian-tab").removeClass("disabled");
      $("#nav-tle-tab").removeClass("disabled");
    }
    $("#spacecraftTrajectory tbody").empty();
    if($(this).find(":selected").data("history")) {
      $(this).find(":selected").data("history").forEach(function(record) {
        $("#spacecraftTrajectory > tbody:last-child").append("<tr>" +
          "<td>" + record.date + "</td>" +
          "<td>" + record.latitude + "</td>" +
          "<td>" + record.longitude + "</td>" +
          "<td>" + record.altitude + "</td>" +
          "<td>" + record.x + "</td>" +
          "<td>" + record.y + "</td>" +
          "<td>" + record.z + "</td>" +
          "</tr>");
      });
    }
    $("#trajectoryJSON").attr("href", "data:text/json;charset=utf-8,"
        + encodeURIComponent(JSON.stringify($(this).find(":selected").data("history"))));
    $("#trajectoryJSON").attr("download", $(this).find(":selected").text()+"_trajectory.json");
    var csv_head = [["date", "latitude", "longitude", "altitude", "x", "y", "z"].join()];
    var csv_body = $.map($(this).find(":selected").data("history"), function(record) {
      return [record.date, record.latitude, record.longitude, record.altitude, record.x, record.y, record.z].join();
    })
    $("#trajectoryCSV").attr("href", "data:text/csv;charset=utf-8,"
        + encodeURIComponent(csv_head.concat(csv_body).join("\n")));
    $("#trajectoryCSV").attr("download", $(this).find(":selected").text()+"_trajectory.csv");
    if($(this).find(":selected").length === 0) {
      $("#trajectoryJSON").addClass("disabled");
      $("#trajectoryCSV").addClass("disabled");
    } else {
      $("#trajectoryJSON").removeClass("disabled");
      $("#trajectoryCSV").removeClass("disabled");
    }
    $("#spacecraftCopy").prop("disabled", $(this).find(":selected").length === 0);
    $("#spacecraftRemove").prop("disabled", $(this).find(":selected").length === 0);
    $("#spacecraftLabel").prop("disabled", $(this).find(":selected").length === 0);
    $("#spacecraftColor").prop("disabled", $(this).find(":selected").length === 0);
    $("#spacecraftTLE").prop("disabled", $(this).find(":selected").length === 0);
    $("#convertTLE").prop("disabled", $(this).find(":selected").length === 0);
    $("#orbitDate").datetimepicker($(this).find(":selected").length === 0 ? "disable" : "enable");
    $("#orbitAltitude").prop("disabled", $(this).find(":selected").length === 0);
    $("#orbitInclination").prop("disabled", $(this).find(":selected").length === 0);
    $("#orbitEccentricity").prop("disabled", $(this).find(":selected").length === 0);
    $("#orbitPerigeeArgument").prop("disabled", $(this).find(":selected").length === 0);
    $("#orbitRightAscensionOfAscendingNode").prop("disabled", $(this).find(":selected").length === 0);
    $("#orbitTrueAnomaly").prop("disabled", $(this).find(":selected").length === 0);
    $("#orbitHarmonics").prop("disabled", $(this).find(":selected").length === 0);
  });
  $("#spacecraftAdd").click(function() {
    $("#spacecraftList").prop("selected", false);
    $("#spacecraftList").append(
      $("<option selected></option>").data("tle","").data("color", "#ff0000").text("New Spacecraft")
    );
    $("#spacecraftList").change();
  });
  $("#spacecraftCopy").click(function() {
    var selected = $("#spacecraftList :selected");
    $("#spacecraftList").prop("selected", false);
    $("#spacecraftList").append(
      selected.clone(true) // clone option
        .data("orbit", $.extend({}, selected.data("orbit"))) // deep copy orbit
        .text(selected.text() + " (Copy)") // update label
        .prop("selected", true) // set selected
    );
    $("#spacecraftList").change();
  });
  $("#spacecraftRemove").click(function() {
    var index = $("#spacecraftList").prop("selectedIndex");
    $("#spacecraftList :selected").remove();
    if($("#spacecraftList option").length > 0) {
      $("#spacecraftList").prop("selectedIndex", Math.min(index, $("#spacecraftList option").length - 1));
    }
    $("#spacecraftList").change();
  });
  $("#spacecraftLabel").change(function() {
    $("#spacecraftList option:selected").text($("#spacecraftLabel").val());
  });
  $("#spacecraftColor").change(function() {
    $("#spacecraftList option:selected").data("color", $("#spacecraftColor").val());
  });
  $("#spacecraftTLE").change(function() {
    $("#spacecraftList option:selected").data("tle", $("#spacecraftTLE").val());
    $("#spacecraftList option:selected").removeData("orbit");
    $("#nav-keplerian-tab").addClass("disabled");
  });

  function getOrbitData() {
    var orbit = $("#spacecraftList option:selected").data("orbit");
    if(!orbit) {
      orbit = {};
      $("#spacecraftList option:selected").removeData("tle");
      $("#nav-tle-tab").addClass("disabled");
    }
    return orbit;
  }

  $("#orbitDate").on("change.datetimepicker", function(e) {
    var orbit = getOrbitData();
    if(e.date) {
      orbit["date"] = e.date;
    } else {
      delete orbit["date"];
    }
    $("#spacecraftList option:selected").data("orbit", orbit);
  });
  $("#orbitAltitude").change(function() {
    var orbit = getOrbitData();
    if($(this).val()) {
      orbit["altitude"] = parseFloat($(this).val())*1e3;
    } else {
      delete orbit["altitude"];
    }
    $("#spacecraftList option:selected").data("orbit", orbit);
  });
  $("#orbitInclination").change(function() {
    var orbit = getOrbitData();
    if($(this).val()) {
      orbit["inclination"] = parseFloat($(this).val());
    } else {
      delete orbit["inclination"];
    }
    $("#spacecraftList option:selected").data("orbit", orbit);
  });
  $("#orbitEccentricity").change(function() {
    var orbit = getOrbitData();
    if($(this).val()) {
      orbit["eccentricity"] = parseFloat($(this).val());
    } else {
      delete orbit["eccentricity"];
    }
    $("#spacecraftList option:selected").data("orbit", orbit);
  });
  $("#orbitPerigeeArgument").change(function() {
    var orbit = getOrbitData();
    if($(this).val()) {
      orbit["perigeeArgument"] = parseFloat($(this).val());
    } else {
      delete orbit["perigeeArgument"];
    }
    $("#spacecraftList option:selected").data("orbit", orbit);
  });
  $("#orbitRightAscensionOfAscendingNode").change(function() {
    var orbit = getOrbitData();
    if($(this).val()) {
      orbit["rightAscensionOfAscendingNode"] = parseFloat($(this).val());
    } else {
      delete orbit["rightAscensionOfAscendingNode"];
    }
    $("#spacecraftList option:selected").data("orbit", orbit);
  });
  $("#orbitTrueAnomaly").change(function() {
    var orbit = getOrbitData();
    if($(this).val()) {
      orbit["trueAnomaly"] = parseFloat($(this).val());
    } else {
      delete orbit["trueAnomaly"];
    }
    $("#spacecraftList option:selected").data("orbit", orbit);
  });
  $("#orbitHarmonics").change(function() {
    var orbit = getOrbitData();
    if($(this).val()) {
      orbit["harmonics"] = $(this).prop("checked");
    } else {
      delete orbit["harmonics"];
    }
    $("#spacecraftList option:selected").data("orbit", orbit);
  });
  $("#orbitHarmonicsDegree").change(function() {
    var orbit = getOrbitData();
    if($(this).val()) {
      if(!orbit.hasOwnProperty("harmonics") || orbit["harmonics"] === true) {
        orbit["harmonics"] = {};
      }
      orbit["harmonics"]["degree"] = parseInt($(this).val());
    } else {
      if(orbit.hasOwnProperty("harmonics")) {
        delete orbit["harmonics"]["degree"];
      }
      if(!orbit["harmonics"].hasOwnProperty("degree") && !orbit["harmonics"].hasOwnProperty("order")) {
        orbit["harmonics"] = true;
      }
    }
    $("#spacecraftList option:selected").data("orbit", orbit);
  });
  $("#orbitHarmonicsOrder").change(function() {
    var orbit = getOrbitData();
    if($(this).val()) {
      if(!orbit.hasOwnProperty("harmonics") || orbit["harmonics"] === true) {
        orbit["harmonics"] = {};
      }
      orbit["harmonics"]["order"] = parseInt($(this).val());
    } else {
      if(orbit.hasOwnProperty("harmonics")) {
        delete orbit["harmonics"]["order"];
      }
      if(!orbit["harmonics"].hasOwnProperty("degree") && !orbit["harmonics"].hasOwnProperty("order")) {
        orbit["harmonics"] = true;
      }
    }
    $("#spacecraftList option:selected").data("orbit", orbit);
  });

  $("#convertTLE").click(function() {
    $.ajax({
      contentType: "application/json",
      data: JSON.stringify({"tle": $("#spacecraftTLE").val().split("\n")}),
      dataType: "json",
      type: "POST",
      url: "/tle2kep",
      success: function(data) {
        $("#spacecraftTLE").val("");
        $("#spacecraftList option:selected").removeData("tle");
        if(data.hasOwnProperty("semimajorAxis")) {
          delete data["semimajorAxis"];
        }
        $("#spacecraftList option:selected").data("orbit", data);
        setUpOrbitPanel(data);
        $("#nav-keplerian-tab").removeClass("disabled");
        $("#nav-keplerian-tab").tab("show");
        $("#nav-tle-tab").addClass("disabled");
      }
    });
  });
  $("#orbitHarmonics").change(function() {
    $("#orbitHarmonicsDegree").prop("disabled", !$(this).prop("checked"));
    $("#orbitHarmonicsOrder").prop("disabled", !$(this).prop("checked"));
    if($(this).prop("checked")) {
      $(".orbitHarmonicsDegreeOrder").show();
    } else {
      $(".orbitHarmonicsDegreeOrder").hide();
    }
  });

  // grab the Cesium API key from webpack
  Cesium.Ion.defaultAccessToken = CESIUM_API_KEY;

  // configure cesium viewer
  var viewer = new Cesium.Viewer("cesiumContainer", {
    baseLayerPicker: false,
    homeButton: false,
    infoBox: false,
    geocoder: false,
    selectionIndicator: false,
    navigationHelpButton: false,
    navigationInstructionsInitiallyVisible: false,
    timeline: true,
    imageryProvider: new Cesium.IonImageryProvider({ assetId: 3845 })
  });
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
  viewer.clock.multiplier = 60;
  viewer.scene.globe.enableLighting = true;

  // execute scenario
  execute();

  // function simulate an inertial frame
  function icrf(scene, time) {
    if (scene.mode !== Cesium.SceneMode.SCENE3D) {
      return;
    }
    var icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(time);
    if (Cesium.defined(icrfToFixed)) {
      var camera = viewer.camera;
      var offset = Cesium.Cartesian3.clone(camera.position);
      var transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
      camera.lookAtTransform(transform, offset);
    }
  }

  // bind event handler to change observer frame
  $("#observerReferenceFrame").change(function() {
    if($(this).val() == "inertial") {
      viewer.scene.postUpdate.addEventListener(icrf);
    } else {
      viewer.scene.postUpdate.removeEventListener(icrf);
    }
  });

  // bind event handler to execute button
  $("#animate").click(animate);

  function animate() {
    // reset viewer entities
    viewer.entities.removeAll();
    // parse start and end time in cesium format and configure viewer
    var startTime = Cesium.JulianDate.fromIso8601(
      $("#animationStart").datetimepicker("date").format()
    );
    var stopTime = Cesium.JulianDate.fromIso8601(
      $("#animationEnd").datetimepicker("date").format()
    );
    viewer.clock.startTime = startTime.clone();
    viewer.clock.currentTime = startTime.clone();
    viewer.clock.stopTime = stopTime.clone();
    viewer.timeline.zoomTo(startTime, stopTime);

    // construct the request body
    $("#spacecraftList > option").each(function() {
      if($(this).data("history") === undefined) {
        return;
      }
      var color = Cesium.Color.fromCssColorString($(this).data("color"));
      // sample the spacecraft position using the sampled values
      var position = new Cesium.SampledPositionProperty();
      $(this).data("history").forEach(function(record) {
        if((moment.utc(record.date).isSame($("#animationStart").datetimepicker("date"))
            || moment.utc(record.date).isAfter($("#animationStart").datetimepicker("date")))
            && (moment.utc(record.date).isSame($("#animationEnd").datetimepicker("date"))
            || moment.utc(record.date).isBefore($("#animationEnd").datetimepicker("date")))) {
          position.addSample(
            Cesium.JulianDate.fromIso8601(record.date),
            Cesium.Cartesian3.fromDegrees(
              record.longitude,
              record.latitude,
              record.altitude
            )
          );
        }
      });
      position.setInterpolationOptions({
        interpolationDegree : 2,
        interpolationAlgorithm : Cesium.LagrangePolynomialApproximation
      });

      // set up the spacecraft animation
      viewer.entities.add({
        availability: new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({
            start: startTime,
            stop: stopTime
          })
        ]),
        position: position,
        orientation: new Cesium.VelocityOrientationProperty(position),
        point: {
          pixelSize: 8,
          color: color
        },
        path: {
          resolution: 1,
          leadTime: 0,
          trailTime: parseFloat($("#trailTime").val())*60*60,
          material: new Cesium.ColorMaterialProperty(color),
          width: 1
        }
      });
    });
  }

  // bind event handler to execute button
  $("#execute").click(execute);

  // execute a scenario
  function execute() {
    // lock execute button and show a waiting animation
    $("#execute").prop("disabled", true);
    $("#execute").html("<span class='spinner-border spinner-border-sm' role='status'><span class='sr-only'>Loading...</span></span>");

    var postsRemaining = $("#spacecraftList > option").length;

    // construct the request body
    $("#spacecraftList > option").each(function() {
      var option = $(this);
      var body = {
        "start": $("#startDate").datetimepicker("date").format(),
        "duration": parseFloat($("#duration").val())*24*60*60,
        "timeStep": parseFloat($("#timeStep").val())
      };
      if(option.data("tle")) {
        body["tle"] = option.data("tle").split("\n");
      } else if(option.data("orbit")) {
        body["orbit"] = option.data("orbit");
      }

      // call the web api
      $.ajax({
        contentType: "application/json",
        data: JSON.stringify(body),
        dataType: "json",
        type: "POST",
        url: "/propagate",
        success: function(data) {
          option.data("history", data.history);
        },
        complete: function() {
          postsRemaining -= 1;
          if(postsRemaining <= 0) {
            // unlock the execute button and replace the text
            $("#execute").prop("disabled", false);
            $("#execute").text("Execute");
            $("#spacecraftList").change();
            animate();
          }
        }
      });
    });
  }
});
