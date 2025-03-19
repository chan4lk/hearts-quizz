import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as web from "@pulumi/azure-native/web";
import * as sql from "@pulumi/azure-native/sql";

// Configuration
const projectName = "bistecquizz";
const stackName = pulumi.getStack();
const resourceGroupName = `${projectName}-${stackName}-rg`;

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup(resourceGroupName, {
    location: "southeastasia",
});

// Create App Service Plan (Basic Tier)
const appServicePlan = new web.AppServicePlan("asp", {
    resourceGroupName: resourceGroup.name,
    kind: "Linux",
    reserved: true,
    sku: {
        name: "B1",
        tier: "Basic",
        size: "B1",
        capacity: 1
    },
});

// Create Frontend App Service (Static Site)
const frontendApp = new web.WebApp("frontend", {
    resourceGroupName: resourceGroup.name,
    serverFarmId: appServicePlan.id,
    name: `${projectName}-frontend-${stackName}`,
    siteConfig: {
        linuxFxVersion: "NODE|20-lts",
        appSettings: [
            { name: "SCM_DO_BUILD_DURING_DEPLOYMENT", value: "false" },
        ],
        http20Enabled: true,
        webSocketsEnabled: true,
        appCommandLine: "pm2 serve /home/site/wwwroot --no-daemon --spa"
    },
});

// Create Backend App Service
const backendApp = new web.WebApp("backend", {
    resourceGroupName: resourceGroup.name,
    serverFarmId: appServicePlan.id,
    name: `${projectName}-backend-${stackName}`,
    siteConfig: {
        linuxFxVersion: "NODE|20-lts",
        appSettings: [
            { name: "WEBSITE_NODE_DEFAULT_VERSION", value: "~20" },
            { name: "WEBSITE_NPM_DEFAULT_VERSION", value: "10.2.4" },
            { name: "SCM_DO_BUILD_DURING_DEPLOYMENT", value: "true" },
        ],
    },
});

// Get SQL admin password from config
const config = new pulumi.Config();
const sqlPassword = config.requireSecret("sqlPassword");

// Create SQL Server
const sqlServer = new sql.Server("sqlserver", {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    administratorLogin: "sqladmin",
    administratorLoginPassword: sqlPassword,
    version: "12.0",
});

// Create SQL Database with 5 DTU (Basic tier)
const sqlDatabase = new sql.Database("sqldb", {
    resourceGroupName: resourceGroup.name,
    serverName: sqlServer.name,
    sku: {
        name: "Basic",
        tier: "Basic",
        capacity: 5, // 5 DTU
    },
    maxSizeBytes: 2147483648, // 2GB
});

// Export the endpoints
export const frontendUrl = pulumi.interpolate`https://${frontendApp.defaultHostName}`;
export const backendUrl = pulumi.interpolate`https://${backendApp.defaultHostName}`;
export const sqlServerName = sqlServer.name;
export const sqlDatabaseName = sqlDatabase.name;
