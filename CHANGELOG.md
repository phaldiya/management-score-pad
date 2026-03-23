# [1.6.0](https://github.com/phaldiya/management-score-pad/compare/v1.5.1...v1.6.0) (2026-03-23)


### Bug Fixes

* upgrade @dicebear/core and @dicebear/collection to 9.4.2 ([dbdf6a5](https://github.com/phaldiya/management-score-pad/commit/dbdf6a52ed6a7312c90e740942bb16cd906c505a))


### Features

* **scoreboard:** add tooltip to in-progress play card ([e6a6232](https://github.com/phaldiya/management-score-pad/commit/e6a6232a8cd21d6792dbef0e8f715a0bbc2d7708))
* **shared:** add auto-positioning Tooltip component ([5165fc3](https://github.com/phaldiya/management-score-pad/commit/5165fc3aa91b7da71f098e90b3260730ef3b99fa))
* **ui:** add tooltips across the app for better discoverability ([7f5af94](https://github.com/phaldiya/management-score-pad/commit/7f5af946ac3d89ea7f031a8e437099b2633c6b84))

## [1.5.1](https://github.com/phaldiya/management-score-pad/compare/v1.5.0...v1.5.1) (2026-03-19)


### Bug Fixes

* **scoreboard:** show dealer icon as superscript next to score ([3f46572](https://github.com/phaldiya/management-score-pad/commit/3f465720798f72825e9f4a272de6a4cb280bab7c))
* upgrade undici to 7.24.0+ to resolve WebSocket vulnerabilities ([78e9e94](https://github.com/phaldiya/management-score-pad/commit/78e9e94a8d4d983140ae60aba2b1f60a159894a4))

# [1.5.0](https://github.com/phaldiya/management-score-pad/compare/v1.4.0...v1.5.0) (2026-03-12)


### Bug Fixes

* upgrade tar to 7.5.11 to resolve symlink path traversal vulnerability ([a523244](https://github.com/phaldiya/management-score-pad/commit/a5232441a7abccbe412907fdaecf799907219df5))


### Features

* **rules:** reorganize game rules into tabbed layout with trick-winning section ([c7e8444](https://github.com/phaldiya/management-score-pad/commit/c7e8444ad5136de2c4242e07804eb88c30ff65e4))

# [1.4.0](https://github.com/phaldiya/management-score-pad/compare/v1.3.1...v1.4.0) (2026-03-09)


### Features

* add game state compression library for transfers ([2c1585c](https://github.com/phaldiya/management-score-pad/commit/2c1585c398bb48fb4f94208707513533c780c851))
* add ImportPage and /import route ([53937fb](https://github.com/phaldiya/management-score-pad/commit/53937fb188f1acb620defb380a9b0703792df1b3))
* add TransferGamePopup and ShareIcon components ([862255f](https://github.com/phaldiya/management-score-pad/commit/862255fc14c7e4e70972a65e4515cf13ae02ab2f))
* **header:** add transfer game button and Shift+S shortcut ([7ad7bcc](https://github.com/phaldiya/management-score-pad/commit/7ad7bcc9d8d2e252b3e22fc9eb200dd2aebbccb8))

## [1.3.1](https://github.com/phaldiya/management-score-pad/compare/v1.3.0...v1.3.1) (2026-03-08)


### Bug Fixes

* **ui:** cap popup max-width to viewport width minus 40px ([f47b82d](https://github.com/phaldiya/management-score-pad/commit/f47b82d7cd727c068edfd8fe7e71b969302385fc))

# [1.3.0](https://github.com/phaldiya/management-score-pad/compare/v1.2.0...v1.3.0) (2026-03-08)


### Bug Fixes

* **ui:** constrain popup width to viewport on mobile ([de9402d](https://github.com/phaldiya/management-score-pad/commit/de9402d35100d41204749354dc8d2fdea5b3bd26))
* **ui:** enable horizontal scroll on scoreboard with many players ([5123efb](https://github.com/phaldiya/management-score-pad/commit/5123efbb4a830382736039fa63c3fc73a0b27b4b))


### Features

* **setup:** limit maximum players to 6 ([6ab52e5](https://github.com/phaldiya/management-score-pad/commit/6ab52e56aba6b0866ee52788920aa26d4e18683c))

# [1.2.0](https://github.com/phaldiya/management-score-pad/compare/v1.1.0...v1.2.0) (2026-03-05)


### Features

* fixed play column width and Cmd+P PDF download shortcut ([97cabd3](https://github.com/phaldiya/management-score-pad/commit/97cabd3ef9ad790a113340843f6b926530634792))

# [1.1.0](https://github.com/phaldiya/management-score-pad/compare/v1.0.0...v1.1.0) (2026-03-04)


### Bug Fixes

* **avatar:** improve picker responsiveness and positioning ([8e152b7](https://github.com/phaldiya/management-score-pad/commit/8e152b7ebfe915127a885f9182884ac23d7cee2e))
* **scoreboard:** improve mobile layout and leader indicator ([a1c54e8](https://github.com/phaldiya/management-score-pad/commit/a1c54e8e0c72cb8cea7b5cf80d43bc7fa775ce17))


### Features

* add UPDATE_BIDS action to edit bids on in-progress rounds ([169efe9](https://github.com/phaldiya/management-score-pad/commit/169efe919894ddeaf17b4272360c3885fb733411))
* **game:** add edit bids UI in details popup ([a123968](https://github.com/phaldiya/management-score-pad/commit/a123968b17bd383a781fb90b9372d0cd84434e37))
* **setup:** add min-length and max-length validation for player names ([ad124aa](https://github.com/phaldiya/management-score-pad/commit/ad124aa79ea57739684b4a28498903c1b1982316))

# 1.0.0 (2026-03-04)


### Features

* UI polish — responsive header button, winner popup, and duplicate error alignment ([d3c9a6b](https://github.com/phaldiya/management-score-pad/commit/d3c9a6b814e68c5b28af89786fef83b94480a092))
