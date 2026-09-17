@echo off
rem dev - shim for server repo release, forwards to zero-dep dart script (no exe build)
rem usage: tools\dev release [--dry-run|-n]
dart "%~dp0dev\main.dart" %*
