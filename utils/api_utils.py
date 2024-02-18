import json
import xml.etree.ElementTree as ET
import streamlit as st
import requests
from requests.auth import HTTPBasicAuth
from streamlit_oauth import OAuth2Component
from .local_connection_utils import api_directory
import pandas as pd
from . enums import *
import re
from collections import abc


def parse_json(json_content):
    try:
        data = json.loads(json_content)
        data["auth_keys"] = data["authentication_details"].keys()
        return data
    except json.JSONDecodeError:
        st.error("Invalid JSON format")
        return None


def parse_xml(xml_content):
    try:
        root = ET.fromstring(xml_content)
        data = {
            "source_name": root.find("source_name").text,
            "authentication": root.find("authentication").text,
            "tables": {elem.tag: elem.text for elem in root.find("tables").iter()}
        }
        return data
    except ET.ParseError:
        st.error("Invalid XML format")
        return None


def check_basic_auth(data):
    url = data["base_url"]
    data.pop("base_url")

    try:
        # Make a GET request to the API endpoint with Basic Authentication
        response = requests.get(url, auth=HTTPBasicAuth(**data))

        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            print('API request successful!')
            print('Response:')
            return response.json()  # Assuming the response is in JSON format
        else:
            print(
                f'API request failed with status code {response.status_code}')
            print('Response:')
            # Print response content for debugging
            return response.text, response.status_code
    except Exception as e:
        return f'An error occurred: {e}'


def check_bearer_token(data):
    url = data["base_url"]
    data.pop("base_url")
    bearer_token = list(data.values())[0]

    # Headers with Bearer token
    headers = {
        'Authorization': f'Bearer {bearer_token}'
    }

    tables = []
    for key, value in st.session_state.api_tab_data.items():
        tables.append(value)

    try:
        # Make a GET request to the API endpoint with Bearer token
        response = requests.get(f"{url}/{tables[0]}", headers=headers)

        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            print('API request successful!')
            print('Response:')
            # Assuming the response is in JSON format
            return {"data": response.json(), "status_code": response.status_code}
        else:
            print(
                f'API request failed with status code {response.status_code}')
            print('Response:')
            return {"data": response.text, "status_code": response.status_code}
            # Print response content for debugging
    except Exception as e:
        print(f'An error occurred: {e}')


def check_oauth2(data):
    oauth2 = OAuth2Component(CLIENT_ID, CLIENT_SECRET, AUTHORIZE_URL,
                             TOKEN_URL, REFRESH_TOKEN_URL, REVOKE_TOKEN_URL)
    # Check if token exists in session state
    if 'token' not in st.session_state:
        # If not, show authorize button
        result = oauth2.authorize_button("Authorize", REDIRECT_URI, SCOPE)
        if result and 'token' in result:
            # If authorization successful, save token in session state
            st.session_state.token = result.get('token')
            st.experimental_rerun()
    else:
        # If token exists in session state, show the token
        token = st.session_state['token']
        st.json(token)
        if st.button("Refresh Token"):
            # If refresh token button is clicked, refresh the token
            token = oauth2.refresh_token(token)
            st.session_state.token = token
            st.experimental_rerun()


def test(con_type, data):
    st.write(f"{con_type} connection: Testing against 1st table.")
    if con_type.lower() == AuthType.BASIC.value:
        return check_basic_auth(data=data)
    elif con_type.lower() == AuthType.OAUTH2.value:
        return check_oauth2(data=data)
    elif con_type.lower() == AuthType.BEARER.value:
        return check_bearer_token(data=data)


def read_api_tables(api_name):
    tables = None
    with open(f"{api_directory}/{api_name}.json") as f:
        data = json.load(f)['tables'].keys()
        tables = [i for i in data]
    return tables


def get_pagination_parameters(main):
    is_offset = main['isoffset']
    is_pagenumber = main['pagenumber']
    is_cursor = main['iscursor']
    key = main['key']
    return key


def read_api_tables_url(api_name, tablename):
    tables = None
    url = None
    first_key = True
    with open(f"{api_directory}/{api_name}.json") as f:
        data = json.load(f)
        url = f"{data['base_url']}/{data['tables'][tablename]}"
        pagination_parameters = get_pagination_parameters(data['pagination'])
        for key,value in pagination_parameters.items():
            if first_key:
                url += f"?{key}={value}"
                first_key = False
            else:
                url += f"&{key}={value}"
        
    return url


def get_data_from_api(table, api,auth_type, token=None, username=None, password=None):
    """
    Retrieve data from an API using Basic Auth or Bearer token.

    Args:
        table (str): The URL of the API endpoint.
        auth_type (str): The authentication type to be used. Either 'basic' or 'bearer'.
        token (str, optional): The Bearer token for authentication. Required if auth_type is 'bearer'.
        username (str, optional): The username for Basic Auth. Required if auth_type is 'basic'.
        password (str, optional): The password for Basic Auth. Required if auth_type is 'basic'.

    Returns:
        dict: The JSON response from the API.
    """
    responses = []
    headers = {}
    final_arr = []
    records=1
    while True:
        table_new = table.format(records=records)
        if auth_type == AuthType.BEARER.value:
            headers['Authorization'] = f'Bearer {token}'
        elif auth_type == AuthType.BASIC.value:
            headers['Authorization'] = requests.auth.HTTPBasicAuth(
                username, password)
        
        response = requests.get(table_new, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data in responses:
                return return_final_df(responses)
            responses.append(data)
            records += 1
        else:
            print(
                f"Failed to retrieve data from {table}. Status code: {response.status_code}")
            return return_final_df(responses)
    return return_final_df(responses)


def return_final_df(responses):
    final_arr = []
    for resp in responses:
        final_arr.append(create_df(resp))
    df = pd.concat(final_arr)
    return df


def create_df(resp):
    parent_key = resp.keys()
    arr =  []
    for key in parent_key:
        real_response = resp[key]
        if isinstance(real_response, dict) or isinstance(real_response, list):
            arr.append(pd.json_normalize(real_response))
        else:
            arr.append(pd.DataFrame([real_response],columns=[key]))
            
    df = pd.concat(arr)
    for col in df.select_dtypes(include='object').columns:
        df[col] = df[col].astype(str)

    return df


def flatten_dict_to_rows(d, sep='_'):
    rows = []
    for k, v in d.items():
        k = re.sub(r"[^_a-zA-Z0-9]", "", k).lower()  # Remove special characters and convert to lowercase
        if isinstance(v, abc.MutableMapping):
            # If the value is a dictionary, recursively flatten it and add each row to the result
            sub_rows = flatten_dict_to_rows(v, sep=sep)
            for sub_k, sub_v in sub_rows:
                new_key = k + sep + sub_k if k else sub_k
                rows.append((new_key, sub_v))
        elif isinstance(v, abc.MutableSequence):
            # If the value is a list or mutable sequence, add each item in the list as a separate row
            for i, item in enumerate(v):
                new_key = k + sep + str(i) if k else str(i)
                rows.append((new_key, item))
        else:
            # For other types of values, add them directly as a row
            rows.append((k, v))
    return rows


def flatten_data(y):
    output = []
    out = {}

    def flatten(x, name=''):
        if type(x) is dict:
            for a in x:
                flatten(x[a], name + a + '_')
        elif type(x) is list:
            for a in x:
                flatten(a, name + '_')
        else:
            output.append((name[:-1], x))
        
    flatten(y)
    return output


def flatten_data_rest(y):
    output = {}
    index = 0
    
    def flatten(x, name='', record_index=None):
        nonlocal index
        if record_index is None:
            record_index = index
        if isinstance(x, dict):
            for key, value in x.items():
                if isinstance(x, list):
                    new_name = name + '_list_' + str(i)  # Name the list as '_list'
                    flatten(item, new_name, record_index)
                elif name:
                    new_name = name + '_' + key
                else:
                    new_name = key
                flatten(value, new_name, record_index)
        elif isinstance(x, list):
            for i, item in enumerate(x):
                new_name = name + '_list_' # Name the list as '_list'
                flatten(item, new_name, record_index)
        else:
            if name in output:
                output[name].append(x)
            else:
                output[name] = [x]
            index += 1
            
    for k, v in y.items():
        flatten(v)

    return output


def get_data(table, api, auth_type, token=None, username=None, password=None):
    table = read_api_tables_url(api, table)
    data = get_data_from_api(table,api, auth_type, token, username, password)
    #merged_df = pd.concat(dfs, ignore_index=True)

    return data

