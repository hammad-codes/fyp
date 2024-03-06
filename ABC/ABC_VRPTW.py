#!/usr/bin/env python

# ---- MODULE DOCSTRING

__doc__ = """

(C) Hive, Romain Wuilbercq, 2017
     _
    /_/_      .'''.
 =O(_)))) ...'     `.
    \_\              `.    .'''X
                       `..'
.---.  .---..-./`) ,---.  ,---.   .-''-.
|   |  |_ _|\ .-.')|   /  |   | .'_ _   \
|   |  ( ' )/ `-' \|  |   |  .'/ ( ` )   '
|   '-(_{;}_)`-'`"`|  | _ |  |. (_ o _)  |
|      (_,_) .---. |  _( )_  ||  (_,_)___|
| _ _--.   | |   | \ (_ o._) /'  \   .---.
|( ' ) |   | |   |  \ (_,_) /  \  `-'    /
(_{;}_)|   | |   |   \     /    \       /
'(_,_) '---' '---'    `---`      `'-..-'

The Artificial Bee Colony (ABC) algorithm is based on the
intelligent foraging behaviour of honey bee swarm, and was first proposed
by Karaboga in 2005.

"""

# ---- IMPORT MODULES

import math
import os
import io
import time 
import json
try:
    import numpy as np
except:
    raise ImportError("Numpy module not installed.")

from .Hive import Utilities
from .Hive import Hive
from json import load, dump
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
# --------------------------------------------------------------------------------------

# Load the given problem, which can be a json file
def load_instance(json_file):
    """
    Inputs: path to json file
    Outputs: json file object if it exists, or else returns NoneType
    """
    if os.path.exists(path=json_file):
        with io.open(json_file, 'rt', newline='') as file_object:
            return load(file_object)
    return None


def routeToSubroute(individual, instance):
    """
    Inputs: Sequence of customers that a route has
            Loaded instance problem
    Outputs: Route that is divided in to subroutes
             which is assigned to each vechicle.
    """
    
    route = []
    sub_route = []
    vehicle_load = 0
    last_customer_id = 0
    vehicle_capacity = instance['vehicle_capacity']
    
    for customer_id in individual:
        # print(customer_id)
        if customer_id == 0:
            demand = 0
        else:
            demand = instance[f"customer_{customer_id}"]["demand"]
        # print(f"The demand for customer_{customer_id}  is {demand}")
        updated_vehicle_load = vehicle_load + demand # Demand here means the load of the customer's order

        if(updated_vehicle_load <= vehicle_capacity):
            sub_route.append(customer_id)
            vehicle_load = updated_vehicle_load
        else:
            route.append(sub_route)
            sub_route = [customer_id]
            vehicle_load = demand
        
        last_customer_id = customer_id

    if sub_route != []:
        route.append(sub_route)

    # Returning the final route with each list inside for a vehicle
    return route


def getRouteCost(individual, instance, unit_cost=1):
    """
    Inputs : 
        - Individual route
        - Problem instance, json file that is loaded
        - Unit cost for the route (can be petrol etc)
    Outputs:
        - Total cost for the route taken by all the vehicles
    """
    total_cost = 0
    updated_route = routeToSubroute(individual, instance)

    for sub_route in updated_route:
        # Initializing the subroute distance to 0
        sub_route_distance = 0
        # Initializing customer id for depot as 0
        last_customer_id = 0

        for customer_id in sub_route:
            # Distance from the last customer id to next one in the given subroute
            distance = instance["distance_matrix"][last_customer_id][customer_id]
            sub_route_distance += distance
            # Update last_customer_id to the new one
            last_customer_id = customer_id
        
        # After adding distances in subroute, adding the route cost from last customer to depot
        # that is 0
        sub_route_distance = sub_route_distance + instance["distance_matrix"][last_customer_id][0]

        # Cost for this particular sub route
        sub_route_transport_cost = unit_cost*sub_route_distance

        # Adding this to total cost
        total_cost = total_cost + sub_route_transport_cost
    
    return total_cost

def getCustomerIndex(customerName):
    if customerName == "depart":
        return 0
    else:
        return int(customerName)


def getTimeWindowViolation(individual, instance):
    sub_routes = routeToSubroute(individual, instance)
    total_time_window_violation = 0

    for sub_route in sub_routes:
        sub_route_time = 0
        last_customer_id = "depart"
        current_time = 0.0
        subroute_time_violations = 0.0

        for customer_id in sub_route:
            time_ij = instance["time_matrix"][getCustomerIndex(
                last_customer_id)][getCustomerIndex(customer_id)]
            current_time += time_ij

            # Check if current time is later than due time
            if current_time > instance[f"customer_{customer_id}"]["due_time"]:
                subroute_time_violations += 100

            # Check if current time is earlier than ready time, Put a penalty if a rider has to wait
            if current_time < instance[f"customer_{customer_id}"]["ready_time"]:
                subroute_time_violations += 10

            if customer_id != "depart":
                current_time += instance[f"customer_{customer_id}"]["service_time"]

            last_customer_id = customer_id

        current_time += instance["time_matrix"][getCustomerIndex(
            last_customer_id)][0]

        # Ensure the depot's due time is not violated
        if current_time > instance.get(f"customer_0", {}).get("due_time", float("inf")):
            subroute_time_violations += current_time - \
                instance.get(f"customer_0", {}).get("due_time", float("inf"))

        total_time_window_violation += subroute_time_violations

    return total_time_window_violation


def evaluator(vector,instance):
    # print(vector)
    # exit
    route_cost = getRouteCost(vector, instance, 1)
    getTimeWindowViolationCost = getTimeWindowViolation(vector, instance)
    
    
    # print("Route Cost: ", route_cost)
    
    return route_cost+getTimeWindowViolationCost

def getRouteStats(routes: list, instance: dict) -> list:
    routesStats = []
    for sub_route,subroute_id in zip(routes, range(len(routes))):

        routeStat = {
            'subroute_id':subroute_id,
            'subroute_cost': getRouteCost(sub_route, instance, 1),
            'subroute_TWV': getTimeWindowViolation(sub_route, instance),
            'subroute_startTime': instance["customer_{}".format(sub_route[0])]["ready_time"]-instance["time_matrix"][0][sub_route[0]], # Time to reach the first customer
            'nTWV': 0,
            'subroute': sub_route,
        }   
        routeStat['customer_stats'] = []
        
        last_customer_id = 0
        startTime = routeStat['subroute_startTime']
        for customer_id, i in zip(sub_route, range(len(sub_route))):
            customer_stat = {}
            
            # if i == 0:
            customer_stat['coordinates'] = instance["customer_{}".format(customer_id)]['coordinates']
            # else:
                # customer_stat['coordinates'] = 'customer'
            
            customer_stat['customer_info'] = instance["customer_{}".format(customer_id)]['customer_info']
            customer_stat['demand'] = instance["customer_{}".format(customer_id)]['demand']
            customer_stat['service_time'] = instance["customer_{}".format(customer_id)]['service_time']
            customer_stat['ready_time'] = instance["customer_{}".format(customer_id)]['ready_time']
            customer_stat['due_time'] = instance["customer_{}".format(customer_id)]['due_time']
            
            customer_stat['customer_id'] = customer_id
            time_ij = instance["time_matrix"][last_customer_id][customer_id]
            startTime += time_ij
            customer_stat['arrival_time'] = startTime
            
            if customer_stat['arrival_time'] > instance["customer_{}".format(customer_id)]["due_time"]:
                customer_stat['is_tw_violated'] = True
                routeStat['nTWV'] += 1
                violation = customer_stat['arrival_time'] - instance["customer_{}".format(customer_id)]["due_time"]
                customer_stat['tw_violation'] = violation
                
                if violation <= 10:
                    customer_stat['TWV_level'] = 'soft'
                elif violation <= 20:
                    customer_stat['TWV_level'] = 'medium'
                else:
                    customer_stat['TWV_level'] = 'hard'
            else:
                customer_stat['is_tw_violated'] = False
                
            startTime += instance["customer_{}".format(customer_id)]["service_time"]
            
            last_customer_id = customer_id
            routeStat['customer_stats'].append(customer_stat)

        #Now add the time to return to depot
        startTime += instance["time_matrix"][last_customer_id][0]
        
        routeStat['subroute_endTime'] = startTime
        routesStats.append(routeStat)
    return routesStats

# def split(results):
#     # add a new dictionary to the results[subroutes] list
#     results['subroutes'].append( results['subroutes'][0].copy())
#     results['subroutes'][1]['customer_stats'] = results['subroutes'][1]['customer_stats'][6:]
#     results['subroutes'][0]['customer_stats'] = results['subroutes'][0]['customer_stats'][:6]
    
#     results['subroutes'][1]['subroute'] = results['subroutes'][1]['subroute'][6:]
#     results['subroutes'][0]['subroute'] = results['subroutes'][0]['subroute'][:6]
    
#     results['subroutes'][1]['subroute_id'] = 1
#     return 


def divideAmongRiders(individual, instance,nRiders):
    
    if nRiders == 1:
        return [individual]
    
    if nRiders>= len(individual):
        return [[i] for i in individual]

    routes = []
    n = len(individual)
    for i in range(nRiders):
        routes.append(individual[i*n//nRiders:(i+1)*n//nRiders])
    return routes
def run():
    
    dataset = 'input'
    print("Dataset: ", dataset)
    instance = load_instance('./data/json/'+dataset+'.json')
        
    # instance = load_instance('./data/json/'+dataset+'.json')
    ndim = int(instance['Number_of_customers'])
    model = Hive.BeeHive(lower=[1]*ndim,
                         upper=[ndim]*ndim,
                         fun=evaluator,
                         numb_bees=1,
                         max_itrs=1000,
                         instance=load_instance('./data/json/'+dataset+'.json'))

    # runs model
    cost = model.run()
    
    solution = model.solution
    print(solution)
    # routes = routeToSubroute(solution, load_instance('./data/json/'+dataset+'.json'))
    # divideAmongRiders
    routes = divideAmongRiders(solution, load_instance('./data/json/'+dataset+'.json'), int(instance['max_vehicle_number']))
    # print(routes)
    routeStats = getRouteStats(routes, load_instance('./data/json/'+dataset+'.json'))
    results = {}
    results['subroutes'] = routeStats
    
    # Information Related to a trip
    results['totalDistance'] = getRouteCost(solution, load_instance('./data/json/'+dataset+'.json'), 1)
    results['time_window_violation'] = getTimeWindowViolation(solution, load_instance('./data/json/'+dataset+'.json'))
    results['nRiders'] = len(routes)
    results['nParcels'] = sum([len(route) for route in routes])
    results['nTWV'] = sum([route['nTWV'] for route in routeStats])
    
    results['dataset']=dataset
    
    # split(results) #! Need to remove this adding for testing functionality.
    return results

if __name__ == "__main__":
    startTime = time.time()
    run()
    endTime = time.time()
    runTime = endTime - startTime
    # print("Total Run Time: ", runTime)


# ---- END

