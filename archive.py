def condense_relations(self, new_method_facts):
    comparison_rels = [f for f in new_method_facts if f.get("type") == "relation"
                       and re.search("[<=>]", str(f.get("name")))]
    other_facts = [f for f in new_method_facts if f not in comparison_rels]
    """
    1. Group comparison relations where they share the same arguments
    2. For each group:
        - Iterate over list of relations
        - Collect all operators present and based on mapping, create new relation is needed. If operator set is:
            - {<}, new relation (<)
            - {>}, new relation (>)
            - {<, =}, new relation (<=)
            - {=, >}, new relation (>=)
            - {<, =, >}, can remove relations as relations allow for any possible comparison relation
    """
    # Convert relations
    # Translate comparison relations
    args = list(set(map(lambda x: (x["arg1"], x["arg2"]), comparison_rels)))
    groups = [[rel for rel in comparison_rels if (rel["arg1"], rel["arg2"]) == arg_tuple] for arg_tuple in args]

    new_relations = []
    for index, group in enumerate(groups):
        new_rel = {"type": "relation", "name": None,
                   "arg1": args[index][0], "arg2": args[index][1]}
        op_set = sorted(set("".join([r.get("name") for r in group])))
        # No need to add new fact for this set of arguments
        if op_set == ["<", "=", ">"]:
            continue
        elif op_set == ["=", ">"]:
            new_rel["name"] = ">="
        else:
            new_rel["name"] = "".join(op_set)

        new_relations.append(Fact(**new_rel))
    other_facts.extend(new_relations)
    return other_facts


    def variablize_subtasks(self, subtasks, other_subtasks, condition_facts):
        # subtasks_mapping = {}
        # other_subtasks_mapping = {}
        params = {}
        print("COMPARING SUBTASKS: ", subtasks, other_subtasks)
        print("VAR MAPPINGS: ", self.var_mappings)
        for i, subtask in enumerate(subtasks):
            for j in range(len(subtask)):
                param = subtasks[i][j]
                other_param = other_subtasks[i][j]
                if param != other_param:
                    """
                        Parameter pairings are generated when facts are being anti-unified. However, order is important
                        so collect var using both orders. If the var mapping appears in one of the condition facts of 
                        the new method, then that var mapping should be used, as it will make the variables defined in
                        the condition facts of the new method and the variables defined in the subtask arguments 
                        consistent.
                    """
                    vars = [self.var_mappings.get((param, other_param)), self.var_mappings.get((other_param, param))]
                    print("VARS: ", vars)
                    print("PARAMS: ", param, other_param)
                    found = False
                    for var in vars:
                        if var:
                            for fact in condition_facts:
                                if var in list(fact.values()):
                                    print("CHOOSING VAR: ", var)
                                    found = True
                                    break
                            if found:
                                break
                    else:
                        print("HITTING ELSE")
                        var = None
                    print("VAR IS NOW: ", var)

                    if var is None:
                        print("VAR IS NONE")
                        if (param, other_param) not in params:
                            params[(param, other_param)] = self.get_new_param_var()
                        print("SETTING SUBTASK TO: ", params[(param, other_param)])
                        subtasks[i][j] = params[(param, other_param)]
                    else:
                        subtasks[i][j] = var
                    print("SUBTASKS IS NOW: ", subtasks)
        return subtasks