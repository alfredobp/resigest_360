"use client";
import React from "react";
import ComponentCard from "../../common/ComponentCard";
import Switch from "../switch/Switch";

export default function ToggleSwitch() {
  const handleSwitchChange = (checked: boolean) => {
    console.log("Switch is now:", checked ? "ON" : "OFF");
  };
  return (
    <ComponentCard title="Toggle switch input">
      <div className="flex gap-4">
        <Switch
          label="Default"
          defaultChecked
          onChange={handleSwitchChange}
        />
        <Switch
          label="Checked"
          defaultChecked
          onChange={handleSwitchChange}
        />
        <Switch label="Disabled" disabled />
      </div>{" "}
      <div className="flex gap-4">
        <Switch
          label="Default"
          defaultChecked
          onChange={handleSwitchChange}
          color="gray"
        />
        <Switch
          label="Checked"
          defaultChecked
          onChange={handleSwitchChange}
          color="gray"
        />
        <Switch label="Disabled" disabled color="gray" />
      </div>
    </ComponentCard>
  );
}
