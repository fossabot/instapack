"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const upath = require("upath");
const os = require("os");
const fse = require("fs-extra");
const chalk_1 = require("chalk");
class PackageManagerSettingMapper {
    constructor() {
        this.key = 'packageManager';
        this.valueTransformer = (value) => value.toLowerCase();
        this.valueValidator = (value) => {
            value = value.toLowerCase();
            return (value === 'yarn' || value === 'npm' || value === 'disabled');
        };
    }
}
exports.PackageManagerSettingMapper = PackageManagerSettingMapper;
class NotificationSettingMapper {
    constructor() {
        this.key = 'muteNotification';
        this.valueTransformer = (value) => {
            return (value.toLowerCase() === 'true');
        };
        this.valueValidator = (value) => {
            value = value.toLowerCase();
            return (value === 'true' || value === 'false');
        };
    }
}
exports.NotificationSettingMapper = NotificationSettingMapper;
class GlobalSettingsManager {
    constructor() {
        this.settingMappers = {
            'package-manager': new PackageManagerSettingMapper(),
            'mute-notification': new NotificationSettingMapper()
        };
    }
    get globalSettingJsonPath() {
        return upath.join(os.homedir(), 'instapack', 'settings.json');
    }
    get availableSettings() {
        return Object.keys(this.settingMappers);
    }
    validate(key, value) {
        if (!this.settingMappers[key]) {
            return false;
        }
        return this.settingMappers[key].valueValidator(value);
    }
    tryRead() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let settings = yield fse.readJson(this.globalSettingJsonPath);
                if (settings.packageManager === undefined) {
                    settings.packageManager = 'yarn';
                }
                if (settings.muteNotification === undefined) {
                    settings.muteNotification = false;
                }
                return settings;
            }
            catch (_a) {
                return {
                    packageManager: 'yarn',
                    muteNotification: false
                };
            }
        });
    }
    set(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = this.globalSettingJsonPath;
            console.log('Global settings file:', chalk_1.default.cyan(file));
            let settings = yield this.tryRead();
            let realKey = this.settingMappers[key].key;
            let realValue = this.settingMappers[key].valueTransformer(value);
            settings[realKey] = realValue;
            yield fse.outputJson(file, settings);
            console.log('Successfully saved the new setting!');
        });
    }
}
exports.GlobalSettingsManager = GlobalSettingsManager;
