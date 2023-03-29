import { Box, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ModalContainer from "react-modal-promise";

import SourceSelector from "./components/SourceSelector";
import WaypointList from "./components/WaypointList";
import { dcsPointActions } from "./store/dcsPoint";
import theWayTheme from "./theme/TheWayTheme";
import TransferControls from "./components/TransferControls";
import TitleBar from "./components/TitleBar";
import ConvertModuleWaypoints from "./utils/ConvertModuleWaypoints";
import GetModuleCommands from "./utils/GetModuleCommands";
import { TwoOptionsDialog } from "./components/TwoOptionsDialog";

const { ipcRenderer } = window.require("electron");

const theme = createTheme(theWayTheme);

function App() {
  const dispatch = useDispatch();
  const module = useSelector((state) => state.dcsPoint.module);
  const dcsWaypoints = useSelector((state) => state.waypoints.dcsWaypoints);

  useEffect(() => {
    ipcRenderer.on("dataReceived", (event, msg) => {
      dispatch(dcsPointActions.changeCoords(JSON.parse(msg)));
    });
  }, [dispatch]);

  const handleTransfer = async () => {
    const moduleWaypoints = ConvertModuleWaypoints(dcsWaypoints, module);
    // Check for special cases which require additional pilot feedback
    if (module === "AH-64D_BLK_II") {
      TwoOptionsDialog({
        title: "What seat are you in?",
        op1: "Pilot",
        op2: "CPG/Gunner",
      })
        .then((option) => {
          let commands;
          if (option === "Pilot") {
            commands = GetModuleCommands("AH-64D_BLK_IIpilot", moduleWaypoints);
          } else {
            commands = GetModuleCommands(
              "AH-64D_BLK_IIgunner",
              moduleWaypoints
            );
          }
          ipcRenderer.send("transfer", commands);
        })
        .catch((err) => {});
    } else if (module === "FA-18C_hornet") {
      //show warning dialog
    } else {
      const commands = GetModuleCommands(module, moduleWaypoints);
      ipcRenderer.send("transfer", commands);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <TitleBar />
      <ModalContainer />
      <Box sx={{ height: "100vh" }}>
        <Box sx={{ height: "25%" }}>
          <SourceSelector />
        </Box>
        <Box sx={{ height: "60%", paddingX: 2 }}>
          <WaypointList />
        </Box>
        <Box sx={{ height: "15%" }}>
          <TransferControls onTransfer={handleTransfer} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
