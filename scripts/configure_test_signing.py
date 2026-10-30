#!/usr/bin/env python3
"""Verify the local test signing identity and securely upload it to test-repo Actions secrets.

No secret is printed or passed on the command line. The private key remains outside Git.
"""
import argparse
import base64
import hashlib
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
REPOSITORY = 'web3service/fitia-mining-pro-test'
OFFICIAL_CERTIFICATE = 'fa3494fb50ee2240f477b7cb21bb0d8606cedceac36a263e1e877f34319fdf72'


def main():
    parser = argparse.ArgumentParser(description='Configure only FITIA PRO TEST signing secrets.')
    parser.add_argument('--verify-only', action='store_true', help='Verify the local key without contacting GitHub.')
    args = parser.parse_args()
    keystore = ROOT / 'android-src/keystore/fitia-release.p12'
    password_file = ROOT / 'android-src/keystore/password'
    pin = (ROOT / 'android-src/release-certificate-sha256.txt').read_text(encoding='utf-8').strip().lower()
    if not re.fullmatch(r'[0-9a-f]{64}', pin) or pin == OFFICIAL_CERTIFICATE:
        raise RuntimeError('Empreinte du certificat de test invalide ou officielle.')
    if not keystore.is_file() or not password_file.is_file():
        raise RuntimeError('Keystore ou mot de passe de test local introuvable.')
    if not args.verify_only:
        # Check permission before reading or attempting to transmit either secret.
        result = subprocess.run(['gh', 'api', f'repos/{REPOSITORY}/actions/secrets/public-key'],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if result.returncode:
            raise RuntimeError('Accès aux secrets Actions refusé : reconnectez GitHub avec les permissions nécessaires.')
    toolchain = Path(os.environ.get('ANDROID_TOOLCHAIN_DIR', '/tmp/android-toolchain'))
    local_keytool = toolchain / 'jdk/bin/keytool'
    keytool = str(local_keytool) if local_keytool.is_file() else shutil.which('keytool')
    if not keytool:
        raise RuntimeError('keytool est nécessaire pour vérifier le certificat avant transfert.')
    password = password_file.read_text(encoding='utf-8').rstrip('\r\n')
    if not password:
        raise RuntimeError('Le mot de passe local est vide.')
    env = os.environ.copy()
    env['FITIA_TEST_VERIFY_PASSWORD'] = password
    result = subprocess.run([keytool, '-exportcert', '-alias', 'fitia-test', '-keystore', str(keystore),
                             '-storepass:env', 'FITIA_TEST_VERIFY_PASSWORD'],
                            env=env, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    if result.returncode or hashlib.sha256(result.stdout).hexdigest() != pin:
        raise RuntimeError('Le keystore ne correspond pas au certificat de test épinglé.')
    if args.verify_only:
        print('Identité de signature de test vérifiée localement.')
        return
    for name, value in (
        ('FITIA_TEST_ANDROID_KEYSTORE_BASE64', base64.b64encode(keystore.read_bytes())),
        ('FITIA_TEST_ANDROID_KEYSTORE_PASSWORD', password.encode('utf-8')),
    ):
        result = subprocess.run(['gh', 'secret', 'set', name, '--repo', REPOSITORY],
                                input=value, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if result.returncode:
            raise RuntimeError(f'Échec de configuration de {name}. Vérifiez les permissions GitHub.')
    print('Secrets de signature configurés pour le dépôt de test uniquement.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
