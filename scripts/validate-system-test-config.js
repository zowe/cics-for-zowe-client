#!/usr/bin/env node
/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 * System Test Configuration Validator
 * 
 * This script validates that all required configuration is in place
 * before running system tests for the SDK and CLI packages.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Validation results
const results = {
  errors: [],
  warnings: [],
  info: [],
};

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

/**
 * Validate SDK configuration
 */
function validateSDKConfig() {
  logSection('Validating SDK System Test Configuration');
  
  const sdkPropertiesPath = path.join(__dirname, '..', 'packages', 'sdk', '__tests__', '__resources__', 'properties', 'custom_properties.yaml');
  const sdkExamplePath = path.join(__dirname, '..', 'packages', 'sdk', '__tests__', '__resources__', 'properties', 'example_properties.yaml');
  
  // Check if custom_properties.yaml exists
  if (!fileExists(sdkPropertiesPath)) {
    logError('SDK custom_properties.yaml not found');
    results.errors.push('SDK: custom_properties.yaml missing');
    logInfo(`Expected location: ${sdkPropertiesPath}`);
    logInfo(`Copy from: ${sdkExamplePath}`);
    return false;
  }
  
  logSuccess('SDK custom_properties.yaml found');
  
  // Load and validate the YAML content
  try {
    const content = fs.readFileSync(sdkPropertiesPath, 'utf8');
    const config = yaml.load(content);
    
    // Validate required fields
    const requiredFields = {
      'cics.user': config?.cics?.user,
      'cics.password': config?.cics?.password,
      'cics.host': config?.cics?.host,
      'cics.port': config?.cics?.port,
      'cmci.regionName': config?.cmci?.regionName,
      'cmci.csdGroup': config?.cmci?.csdGroup,
    };
    
    let allFieldsValid = true;
    
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value === 'zosmf-user' || value === 'zosmf-password' || 
          value === 'zosmf-host' || value === 'region-name' || value === 'CSDGROUP') {
        logError(`SDK: ${field} is not configured (still has placeholder value)`);
        results.errors.push(`SDK: ${field} needs to be configured`);
        allFieldsValid = false;
      } else {
        logSuccess(`SDK: ${field} is configured`);
      }
    }
    
    // Check optional fields
    if (config?.cics?.protocol) {
      logInfo(`SDK: Protocol set to '${config.cics.protocol}'`);
    }
    
    if (config?.cics?.rejectUnauthorized !== undefined) {
      logInfo(`SDK: rejectUnauthorized set to '${config.cics.rejectUnauthorized}'`);
    }
    
    return allFieldsValid;
    
  } catch (err) {
    logError(`SDK: Failed to parse custom_properties.yaml: ${err.message}`);
    results.errors.push(`SDK: Invalid YAML format - ${err.message}`);
    return false;
  }
}

/**
 * Validate CLI configuration
 */
function validateCLIConfig() {
  logSection('Validating CLI System Test Configuration');
  
  const cliPropertiesPath = path.join(__dirname, '..', 'packages', 'cli', '__tests__', '__resources__', 'properties', 'custom_properties.yaml');
  const cliExamplePath = path.join(__dirname, '..', 'packages', 'cli', '__tests__', '__resources__', 'properties', 'example_properties.yaml');
  
  // Check if custom_properties.yaml exists
  if (!fileExists(cliPropertiesPath)) {
    logError('CLI custom_properties.yaml not found');
    results.errors.push('CLI: custom_properties.yaml missing');
    logInfo(`Expected location: ${cliPropertiesPath}`);
    logInfo(`Copy from: ${cliExamplePath}`);
    return false;
  }
  
  logSuccess('CLI custom_properties.yaml found');
  
  // Load and validate the YAML content
  try {
    const content = fs.readFileSync(cliPropertiesPath, 'utf8');
    const config = yaml.load(content);
    
    // Validate required fields
    const requiredFields = {
      'cics.user': config?.cics?.user,
      'cics.password': config?.cics?.password,
      'cics.host': config?.cics?.host,
      'cics.port': config?.cics?.port,
      'cmci.regionName': config?.cmci?.regionName,
      'cmci.csdGroup': config?.cmci?.csdGroup,
    };
    
    let allFieldsValid = true;
    
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value === 'my-user-name' || value === 'my-password' || 
          value === 'my-cics-host' || value === 'my-region-name' || value === 'my-csd-group') {
        logError(`CLI: ${field} is not configured (still has placeholder value)`);
        results.errors.push(`CLI: ${field} needs to be configured`);
        allFieldsValid = false;
      } else {
        logSuccess(`CLI: ${field} is configured`);
      }
    }
    
    // Check optional fields
    if (config?.cics?.protocol) {
      logInfo(`CLI: Protocol set to '${config.cics.protocol}'`);
    }
    
    if (config?.cics?.rejectUnauthorized !== undefined) {
      logInfo(`CLI: rejectUnauthorized set to '${config.cics.rejectUnauthorized}'`);
    }
    
    return allFieldsValid;
    
  } catch (err) {
    logError(`CLI: Failed to parse custom_properties.yaml: ${err.message}`);
    results.errors.push(`CLI: Invalid YAML format - ${err.message}`);
    return false;
  }
}

/**
 * Check for Zowe CLI installation (required for CLI tests)
 */
function checkZoweCLI() {
  logSection('Checking Zowe CLI Installation');
  
  const { execSync } = require('child_process');
  
  try {
    const version = execSync('zowe --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    logSuccess(`Zowe CLI is installed: ${version.trim()}`);
    return true;
  } catch (err) {
    logWarning('Zowe CLI is not installed or not in PATH');
    results.warnings.push('Zowe CLI not found - required for CLI system tests');
    logInfo('Install with: npm install -g @zowe/cli');
    return false;
  }
}

/**
 * Check Node.js version
 */
function checkNodeVersion() {
  logSection('Checking Node.js Version');
  
  const currentVersion = process.version;
  const requiredVersion = 'v18.12.0';
  
  logInfo(`Current Node.js version: ${currentVersion}`);
  logInfo(`Required Node.js version: >= ${requiredVersion}`);
  
  const current = currentVersion.slice(1).split('.').map(Number);
  const required = requiredVersion.slice(1).split('.').map(Number);
  
  if (current[0] > required[0] || 
      (current[0] === required[0] && current[1] >= required[1])) {
    logSuccess('Node.js version meets requirements');
    return true;
  } else {
    logError('Node.js version is too old');
    results.errors.push(`Node.js version ${currentVersion} is below required ${requiredVersion}`);
    return false;
  }
}

/**
 * Main validation function
 */
function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     CICS for Zowe - System Test Configuration Validator           ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════╝', 'cyan');
  
  // Run all validations
  const nodeValid = checkNodeVersion();
  const sdkValid = validateSDKConfig();
  const cliValid = validateCLIConfig();
  const zoweInstalled = checkZoweCLI();
  
  // Summary
  logSection('Validation Summary');
  
  if (results.errors.length === 0 && results.warnings.length === 0) {
    logSuccess('All validations passed! ✓');
    logInfo('\nYou can now run system tests:');
    logInfo('  • SDK tests: npm run test:system --workspace=packages/sdk');
    logInfo('  • CLI tests: npm run test:system --workspace=packages/cli');
    logInfo('  • All tests: npm run test:system');
    process.exit(0);
  } else {
    if (results.errors.length > 0) {
      log('\nErrors found:', 'red');
      results.errors.forEach(err => logError(err));
    }
    
    if (results.warnings.length > 0) {
      log('\nWarnings:', 'yellow');
      results.warnings.forEach(warn => logWarning(warn));
    }
    
    log('\nPlease fix the errors above before running system tests.', 'yellow');
    process.exit(1);
  }
}

// Run the validator
main();
