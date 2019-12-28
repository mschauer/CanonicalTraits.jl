var documenterSearchIndex = {"docs":
[{"location":"#CanonicalTraits.jl-1","page":"Home","title":"CanonicalTraits.jl","text":"","category":"section"},{"location":"#","page":"Home","title":"Home","text":"","category":"page"},{"location":"#Trait-Definition-1","page":"Home","title":"Trait Definition","text":"","category":"section"},{"location":"#","page":"Home","title":"Home","text":"@trait Addable{L, R} begin\n    (+) :: [L, R] => Any\n    (+) = Base.:+\nend","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Above code gives a naive implementation of +.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"(+) :: [L, R] => Any says (+) is a function that takes 2 arguments typed L and R, and return an Any.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"(+) = Base.:+ says + has a default implementation Base.:+.","category":"page"},{"location":"#Implementation-1","page":"Home","title":"Implementation","text":"","category":"section"},{"location":"#","page":"Home","title":"Home","text":"If all methods have a default implementation, you can do","category":"page"},{"location":"#","page":"Home","title":"Home","text":"@implement Addable{Int, Int}","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Otherwise, if there's such a trait","category":"page"},{"location":"#","page":"Home","title":"Home","text":"@trait Show{A} begin\n   show :: A => String\nend","category":"page"},{"location":"#","page":"Home","title":"Home","text":"We'll have","category":"page"},{"location":"#","page":"Home","title":"Home","text":"julia> @implement Show{Int}\nERROR: LoadError: No default method show for Show.\n\njulia> @implement Show{Int} begin\n    show(x) = string(x)\nend\n\njulia> show(114514)\n\"114514\"","category":"page"},{"location":"#Functional-Dependency-1","page":"Home","title":"Functional Dependency","text":"","category":"section"},{"location":"#","page":"Home","title":"Home","text":"This is an example of defining Vector-like traits,","category":"page"},{"location":"#","page":"Home","title":"Home","text":"function vect_eltype_infer end\n@trait Vect{F, V} where {F = vect_infer_helper(V)} begin\n    scalar_mul :: [F, V] => V\n    scalar_div :: [V, F] => V\n\n    vec_add    :: [V, V] => V\n    vec_sub    :: [V, V] => V\n\n    scalar_add :: [F, V] => V\n    scalar_sub :: [V, F] => V\n\n    scalar_div(vec :: V, scalar :: F) = scalar_mul(one(F)/scalar, vec)\n    scalar_sub(vec :: V, scalar :: F) = scalar_add(-scalar, vec)\n    vec_sub(vec1 :: V, vec2 :: V)     = vec_add(vec1, scalar_mul(-one(F), vec2))\nend","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Note that, for some methods of Vect, we cannot infer out the type F with their argument types:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"vec_add    :: [V, V] => V\nvec_sub    :: [V, V] => V","category":"page"},{"location":"#","page":"Home","title":"Home","text":"However, for instance, we know,","category":"page"},{"location":"#","page":"Home","title":"Home","text":"when V  is Vector{T}, V is T.\nwhen V is NTuple{5, T}, V is T\netc.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"This is called functional dependency, and to work with this, we provide the capability of using this, check the head of the definition of Vect:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"@trait Vect{F, V} where {F = vect_infer_helper(V)} begin","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Which means that F is decided by V with vect_infer_helper.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"This is an example of making Tuple{F, F} Vector-like:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"vect_infer_helper(::Type{Tuple{F, F}}) where F<:Number = F\n\n@implement Vect{F, Tuple{F, F}} where F <: Number begin\n    scalar_add(num, vec) =\n        (vec[1] + num, vec[2] + num)\n    vec_add(vec1, vec2) =\n        (vec1[1] + vec2[1], vec1[2] + vec2[2])\n    scalar_mul(num, vec) =\n        (num * vec[1], num * vec[2])\nend","category":"page"},{"location":"#Use-Case-from-An-Example:-Gram-Schmidt-orthogonalization-1","page":"Home","title":"Use Case from An Example: Gram-Schmidt orthogonalization","text":"","category":"section"},{"location":"#","page":"Home","title":"Home","text":"Traits manage constraints, making the constraints reasonable and decoupling implementations.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"In the late 2019, a friend of mine, Yinbo, asked me if traits can help writing orthogonalizations, because he is working for projects about JuliaDiffEq.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"After pondering for some time, I made a trait-based design for Gram-Schmidt orthogonalization.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"I tidied up the logic in this way:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Gram-Schmidt orthogonalization is defined","category":"page"},{"location":"#","page":"Home","title":"Home","text":"in an inner product space.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"An inner product space derives a trait, I call it InnerProduct.\nAn inner prduct space is a vector space, with an additional structure called an inner product, which tells that we need a vector space.\nA vector space, a.k.a linear space, given a set of scalar numbers F, it is a carrier set V occupied with these operations:\nvector addition: + : V × V → V\nscalar multiplication: * : F × V → V\nJust make a trait Vect for the vector space.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Then we can use CanonicalTraits.jl to transform above mathematical hierarchy into elegant Julia codes:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"function scalartype_of_vectorspace end\n@trait Vect{F <: Number, V} where\n    {F = scalartype_of_vectorspace(V)} begin\n   vec_add    :: [V, V] => V\n   scalar_mul :: [F, V] => V\nend\n\n@trait InnerProduct{F <: Number, V} where \n    {F = scalartype_of_vectorspace(V)} begin\n    dot :: [V, V] => F\nend","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Then we can implement Gram-Schmidt orthogonalization,","category":"page"},{"location":"#","page":"Home","title":"Home","text":"function gram_schmidt!(v :: V, vs :: Vector{V})::V where V\n    for other in vs\n        coef = dot(v, other) / dot(other, other)\n        incr = scalar_mul(-coef, other)\n        v = vec_add(v, incr)\n    end\n    magnitude = sqrt(dot(v, v))\n    scalar_mul(1/magnitude, v)\nend","category":"page"},{"location":"#","page":"Home","title":"Home","text":"gram_schmidt!(a, [b, c, d]) will Gram-Schmidt orthogonalize a with b, c, d.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Now, other than a clean implementation, another advantage of using traits comes out:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"julia> gram_schmidt!([1.0, 1, 1], [[1.0, 0, 0], [0, 1.0, 0]])\nERROR: MethodError: no method matching scalartype_of_vectorspace(::Type{Array{Float64,1}})","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Okay, we want to use gram_schmidt! on Vector{Float64}, but we have to implement scalartype_of_vectorspace first.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"So we just say the scalar set is the real numbers\"","category":"page"},{"location":"#","page":"Home","title":"Home","text":"julia> scalartype_of_vectorspace(::Type{Vector{Float64}}) = Real\n\njulia> gram_schmidt!([1.0, 1, 1], [[1.0, 0, 0], [0, 1.0, 0]])\nERROR: Not implemented trait InnerProduct for (Real, Array{Float64,1}).","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Okay, we should implement InnerProduct{Real, Vector{Float64}}.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"julia> @implement InnerProduct{Real, Vector{Float64}} begin\n           dot(a, b) = sum([ai*bi  for (ai, bi) in zip(a, b)])\n       end\n\njulia> gram_schmidt!([1.0, 1, 1], [[1.0, 0, 0], [0, 1.0, 0]])\nERROR: Not implemented trait Vect for (Float64, Array{Float64,1}).","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Okay, we implement Vect{Real, Vector{Float64}}.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"julia> @implement Vect{Real, Vector{Float64}} begin\n          vec_add(x, y) = Float64[xi + yi for (xi, yi) in zip(x, y)]\n          scalar_mul(a, x) = Float64[(a)xi for xi in x]\n       end\njulia> gram_schmidt!([1.0, 1, 1], [[1.0, 0, 0], [0, 1.0, 0]])\n3-element Array{Float64,1}:\n 0.0\n 0.0\n 1.0","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Nice.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Besides, note that CanonicalTraits.jl is zero-cost.","category":"page"}]
}
