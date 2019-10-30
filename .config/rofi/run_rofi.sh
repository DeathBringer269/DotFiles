#!/usr/bin/env bash
theme=${1:-$HOME/.config/rofi/config.rasi}
selection=$(echo -e "${options}" | rofi -dmenu -config $theme)
