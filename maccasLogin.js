
    
    var app = angular.module("learningCloud");
    app.config(function ($routeProvider) {
        $routeProvider
            .when("/Login", {
                templateUrl: "/Account/Login"
            })
            .when("/ForgottenPassword", {
                templateUrl: "/Account/ForgottenPassword"
            })
            .when("/ForgottenPassword/:emailAddress", {
                templateUrl: "/Account/ForgottenPassword"
            })
            .when("/PasswordReset", {
                templateUrl: "/Account/PasswordReset"
            })
            .when("/Safari", {
                templateUrl: "/Account/SafariPrivateMode"
            })
            .when("/IE", {
                templateUrl: "/Account/IE"
            })
            .otherwise({ redirectTo: "/Login" });
    });


    var loginController = function ($scope, $location, $window, configSrv, accountSrv, langStringsSrv, navigationSrv, $routeParams, $route, appContextSrv) {

        var emailAddress = "";
        if ($routeParams.emailAddress) { emailAddress = $routeParams.emailAddress; }
        $scope.UserName = "";
        $scope.Password = "";
        $scope.pwdInputType = "Password";
        $scope.iconEye = "fa fa-eye fa-lg";
        $scope.togglePwd = function () {
            $scope.pwdInputType == "Password" ? $scope.pwdInputType = "" : $scope.pwdInputType = "Password";
            $scope.iconEye == "fa fa-eye fa-lg" ? $scope.iconEye = "fa fa-eye-slash fa-lg" : $scope.iconEye = "fa fa-eye fa-lg";
        }
        $scope.fpSuccess = false;
        $scope.fpError = false;
        $scope.ErrorMsg = { value: "" };
        $scope.userEmail = { value: emailAddress };
        $scope.eightCharClass = "btn-default";
        $scope.ucaseClass = "btn-default";
        $scope.spCharClass = "btn-default";
        $scope.numericClass = "btn-default";
        $scope.passwordValid = false;
        $scope.ResetToken = "";
        $scope.emailAddressExists = false;

        var ie = (!!window.ActiveXObject && +(/msie\s(\d+)/i.exec(navigator.userAgent)[1])) || NaN;
        if (ie === 9) {
            $scope.isIE9 = true;
        } else
            $scope.isIE9 = false;

        $scope.environment = appContextSrv.environment;
        $scope.platform = $scope.environment.isDevice ? "App" : "Web";

        
        $scope.submitForm = function (isValid) {
            // check to make sure the form is completely valid
            if (isValid) {
                var loginData = {
                    "UserName": $scope.UserName,
                    "Password": $scope.Password,
                };

                var environmentData = getEnvironmentData();
                if (sessionStorage.userMenu_selectedTab) sessionStorage.removeItem("userMenu_selectedTab");
                accountSrv.login(loginData, environmentData).then(onLogin, WSErrorWrapper('{e1c5147a-bee7-43fc-97c8-068aecb1cf0d}', onLoginError));

            } else {
                //should be unreacheable
                alert('invalid form');
            }
        };

        var onLogin = function (result) {
            if (result.Successful) {
                sessionStorage.setItem('LearningCloud_LoginTime', JSON.stringify(Date.now()));
                if (result.ErrorCode == 0) {
                    $window.location.href = result.ReturnUrl;
                } else {
                    //First login
                    $window.location.href = '#/PasswordReset/';
                } 
            }
            else {
                onLoginError(result);
            } 
        }

        var onLoginError = function (result) {
            $scope.fpError = true;
            $scope.ErrorMsg.value = result.ErrorMessage;
        }

        $scope.submitfpForm = function () {
            $scope.fpError = false;
            accountSrv.resetPassword($scope.userEmail.value).then(onResetPassword);
        };

        var onResetPassword = function (result) {
            if (result.Successful) {
                $scope.fpSuccess = true;
                $scope.fpError = false;
                $scope.userEmail.value = result.Data;
            }
            else {
                $scope.fpSuccess = false;
                $scope.fpError = true;
                $scope.ErrorMsg.value = result.ErrorMessage;
            }
        }

        $scope.validateFPForm = function() {
            var fieldValue = $scope.userEmail.value;

            if (!fieldValue || fieldValue == "") {
                return false;
            }
            if (!isNaN(fieldValue)) {
                return true;
            }

            var atpos = fieldValue.indexOf("@");
            var dotpos = fieldValue.lastIndexOf(".");
            if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= fieldValue.length) {
                return false;
            }
            return true;
        }

        $scope.submitResetForm = function () {
            var params = { ResetToken: $scope.ResetToken, Password: $scope.Password };
            var environmentData = getEnvironmentData();
            environmentData.EventType = "SavePasswordAndLogin";
            accountSrv.savePasswordAndLogin(params, environmentData).then(onLogin, WSErrorWrapper('{8613a833-bc59-414a-9ca8-6d72185b8ef0}', onLoginError));
        }

        var getEnvironmentData = function() {
            var environmentData = {
                "EventType": "Login",
                "Platform": $scope.platform,
                "OsName": $scope.environment.osName,
                "OsVersion": $scope.environment.osVersion,
                "BrowserName": $scope.environment.browserName,
                "BrowserVersion": $scope.environment.browserVersion,
                "Device": $scope.environment.device,
                "WindowSize": $scope.environment.windowSize
            }
            return environmentData;
        }

        var onGetConfigError = function () {
            $window.alert(langStringsSrv.get("core.CannotFetchConfiguration"));
        };

        var onGetConfig = function (result) {
            var data = result.Data;
            $scope.config = data;
        };

        $scope.checkPassword = function () {
            var pw = $scope.Password;
            var config = $scope.config;
            if (pw.length >= 8) {
                $scope.eightCharClass = "btn-success";
            } else {
                $scope.eightCharClass = "btn-default";
            }
            if (/[A-Z]/.test(pw)) {
                $scope.ucaseClass = "btn-success";
            }
            else {
                $scope.ucaseClass = "btn-default";
            }
            if (/[0-9]/.test(pw)) {
                $scope.numericClass = "btn-success";
            }
            else {
                $scope.numericClass = "btn-default";
            }
            if (!(/^[a-zA-Z0-9]+$/.test(pw))) {
                $scope.spCharClass = "btn-success";
            }
            else {
                $scope.spCharClass = "btn-default";
            }

            if (pw.length >= 8
                    && ($scope.ucaseClass == "btn-success" || config['UserMgmt.PasswordUpperCaseSetting'] == 'Off')
                    && ($scope.spCharClass == "btn-success" || config['UserMgmt.PasswordSpecialCharSetting'] == 'Off')
                    && ($scope.numericClass == "btn-success" || config['UserMgmt.PasswordNumericSetting'] == 'Off')) {
                $scope.passwordValid = true;
            }
            else {
                $scope.passwordValid = false;
            }
        }

        $scope.checkEmailAndContinue = function () {
            var params = { emailAddress: $scope.userEmail.value };
            accountSrv.checkEmailExists(params).then(onCheckingEmail);
        }

        var onCheckingEmail = function (emailExists) {
            if (emailExists == 'True') {
                $scope.emailAddressExists = true;
            }
            else {
                $window.location.href = '/Account/CreateAccount?emailAddress=' + encodeURIComponent($scope.userEmail.value);
            }
        }

        $scope.resetNewUser = function () {
            if ($scope.emailAddressExists) {
                $scope.userEmail.value = "";
                $scope.emailAddressExists = false;
            }
        }

        $scope.socialRedirect = function (redirectUrl) {
            var environmentData = getEnvironmentData();
            environmentData.EventType = "SMediaWeb";
            document.location.href = redirectUrl + "?environmentDataJson=" + JSON.stringify(environmentData);
        }
        
        configSrv.getConfig('db.CoreApp.UserMgmnt').then(onGetConfig, WSErrorWrapper('{cd1c74a5-0e07-49c6-8d9d-0e1e956771a7}', onGetConfigError));

        var pageTitle = "";
        var w = $window.innerWidth;
        if (w <= 767) {
            $scope.parentobj.showLogo = false;
        }
        

        switch ($route.current.templateUrl) {
        case '/Account/ForgottenPassword':
            pageTitle = "Forgot Password";
            break;
        case '/Account/PasswordReset':
            pageTitle = "Reset Password";
            break;
        default:
            pageTitle = "Login";
            $scope.parentobj.showLogo = true;
        }

        navigationSrv.addBackAction(pageTitle, function () { $window.location.href = "/Account#/Login"; });

        $scope.passwordEmailActive = false;
        accountSrv.isEmailActive("usermgmt.forgottenpassword").then(function (result) {
            $scope.passwordEmailActive = result == "True";
        });

        return {
            go: function (url) { $window.location.href = url; }
        }

    };

    app.controller('loginController', loginController);

